// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const fs = require("fs");
// const { get } = require("http");
// require("dotenv").config(); // Load API key from .env

// const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);

// // Define the AI model to use
// const model = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash",
// });

// // Configuration for AI response
// const generationConfig = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "application/json",
// };

// // Function to get crop schedule and save it as a JSON file
// async function getCropSchedule(
//   country,
//   state,
//   district,
//   soilType,
//   climate,
//   crop,
//   year
// ) {
//   try {
//     // Construct the input prompt
//     const prompt = `You are a specialized AI for Indian agriculture. Given:
//     - Country: ${country}
//     - State: ${state}
//     - District: ${district}
//     - Soil Type: ${soilType}
//     - Climate Condition: ${climate}
//     - Crop Name: ${crop}
//     - Target Year: ${year}

//     Generate a JSON-based crop schedule including:
//     - Land preparation
//     - Sowing
//     - Irrigation
//     - Fertilization
//     - Weeding
//     - Pest control
//     - Harvesting

//     Ensure all tasks start no earlier than January 1 of the given year. Use ISO date format (YYYY-MM-DD). If a task is not applicable, return "NA".

//     Example output:
//     {
//       "country": "India",
//       "state": "Gujarat",
//       "district": "Ahmedabad",
//       "soil_type": "Black Soil",
//       "climate_condition": "Semi-Arid",
//       "crop_name": "Cotton",
//       "year": 2027,
//       "land_preparation_start": "2027-05-01",
//       "land_preparation_end": "2027-06-15",
//       "sowing_start": "2027-06-15",
//       "sowing_end": "2027-07-31",
//       "planting_start": "NA",
//       "planting_end": "NA",
//       "fertilization_1": "2027-07-15",
//       "fertilization_2": "2027-08-30",
//       "irrigation_start": "2027-07-01",
//       "irrigation_end": "2027-11-30",
//       "weeding_1": "2027-07-01",
//       "weeding_2": "2027-08-15",
//       "pest_control_1": "2027-08-01",
//       "pest_control_2": "2027-09-15",
//       "harvesting_start": "2027-11-01",
//       "harvesting_end": "2027-12-31"
//     }`;

//     // Call Gemini AI API with structured input
//     const response = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig,
//     });

//     // Extract response text
//     const resultText = response.response.text();

//     // Convert text to JSON
//     let jsonData;
//     try {
//       jsonData = JSON.parse(resultText);
//     } catch (parseError) {
//       console.error("Error parsing AI response:", parseError);
//       return;
//     }

//     // Save JSON output to a file
//     // const fileName = `crop_schedule_${crop}_${year}.json`;
//     const fileName = `${crop}_response.json`;
//     fs.writeFileSync(fileName, JSON.stringify(jsonData, null, 2));

//     console.log(`Crop schedule saved to ${fileName}`);
//   } catch (error) {
//     console.error("Error generating crop schedule:", error);
//   }
// }

// // Example Usage
// getCropSchedule(
//   "India",
//   "Maharashtra",
//   "Pune",
//   "Black Soil",
//   "Tropical",
//   "Wheat",
//   "2027"
// );

// // Example Usage 2
// getCropSchedule(
//   "India",
//   "Gujarat",
//   "Ahmedabad",
//   "Black Soil",
//   "Semi-Arid",
//   "Cotton",
//   "2027"
// );

// // country: India,
// // region: Maharashtra,
// // area: Nashik,
// // soil type: Black Soil,
// // climate condition: Hot and Dry,
// // crop name: Grapes,
// // year: 2027
// getCropSchedule(
//   "India",
//   "Maharashtra",
//   "Nashik",
//   "Black Soil",
//   "Hot and Dry",
//   "Grapes",
//   "2027"
// );

///////////////////////////////////////////////////////////////////////////////

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch"); // Ensure you installed node-fetch: npm install node-fetch
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Gemini AI Setup ---
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// --- Weather API Setup ---
const WEATHER_API_KEY = process.env.WEATHER_API_KEY; // Your WeatherAPI key
const WEATHER_API_BASE = "http://api.weatherapi.com/v1";

// Utility: Fetch weather data for a given location and date.
async function getWeatherData(location, date) {
  try {
    const url = `${WEATHER_API_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
      location
    )}&dt=${date}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Weather API error:", await response.text());
      return null;
    }
    const data = await response.json();
    if (
      data &&
      data.forecast &&
      data.forecast.forecastday &&
      data.forecast.forecastday.length > 0
    ) {
      return data.forecast.forecastday[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

// --- Endpoint: Generate Crop Schedule & Tips ---
app.post("/generate-schedule", async (req, res) => {
  try {
    const { country, region, area, soil, climate, cropName, year } = req.body;
    if (
      !country ||
      !region ||
      !area ||
      !soil ||
      !climate ||
      !cropName ||
      !year
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- Part 1: Generate Crop Schedule ---
    const schedulePrompt = `You are an expert agricultural advisor for Indian agriculture. 
Given the following parameters:
- Country: ${country}
- State: ${region}
- District/City: ${area}
- Soil Type: ${soil}
- Climate Condition: ${climate}
- Crop Name: ${cropName}
- Target Year: ${year}

Generate a complete crop schedule in JSON format with the following keys:
- land_preparation_start
- land_preparation_end
- sowing_start
- sowing_end
- irrigation_start
- irrigation_end
- fertilization_1
- fertilization_2
- weeding_1
- weeding_2
- pest_control_1
- pest_control_2
- harvesting_start
- harvesting_end

For each task, also provide a corresponding key prefixed with "tips_" (for example, "tips_sowing_start") containing a one-sentence actionable tip based on general weather conditions. Finally, include an overall key "overall_note" that briefly explains whether the crop is suitable for the given conditions.

All dates must be in ISO format (YYYY-MM-DD). For any task that is not applicable, return "NA".

Pretend you’re a highly trained model for agricultural planning in India. A user wants a schedule for the upcoming year, with tasks only after January 1 of that year. Provide JSON fields (land_preparation, sowing, irrigation, fertilization, etc.). For anything irrelevant, write “NA.” Dates must be in YYYY-MM-DD.

Example output:
{
  "country": "India",
  "state": "Gujarat",
  "district": "Ahmedabad",
  "soil_type": "Black Soil",
  "climate_condition": "Semi-Arid",
  "crop_name": "Cotton",
  "year": 2027,
  "land_preparation_start": "2027-05-01",
  "tips_land_preparation_start": "Ensure the soil is adequately moist before starting.",
  "land_preparation_end": "2027-06-15",
  "tips_land_preparation_end": "No adjustment needed.",
  "sowing_start": "2027-06-15",
  "tips_sowing_start": "Delay sowing if heavy rains are forecast.",
  "sowing_end": "2027-07-31",
  "tips_sowing_end": "Monitor for pest emergence after sowing.",
  "irrigation_start": "2027-07-01",
  "tips_irrigation_start": "Increase irrigation if temperatures are high.",
  "irrigation_end": "2027-11-30",
  "tips_irrigation_end": "Reduce irrigation frequency as harvest nears.",
  "fertilization_1": "2027-07-15",
  "tips_fertilization_1": "Apply fertilizer after the first weeding.",
  "fertilization_2": "2027-08-30",
  "tips_fertilization_2": "Use organic fertilizer for sustained growth.",
  "weeding_1": "2027-07-01",
  "tips_weeding_1": "Perform weeding early to reduce competition with crops.",
  "weeding_2": "2027-08-15",
  "tips_weeding_2": "Monitor for invasive species and act accordingly.",
  "pest_control_1": "2027-08-01",
  "tips_pest_control_1": "Implement integrated pest management strategies.",
  "pest_control_2": "2027-09-15",
  "tips_pest_control_2": "Inspect regularly and adjust treatments as necessary.",
  "harvesting_start": "2027-11-01",
  "tips_harvesting_start": "Harvest early in the morning for best quality.",
  "harvesting_end": "2027-12-31",
  "tips_harvesting_end": "Store harvested crops in a cool, dry place.",
  "overall_note": "Based on the provided conditions, the crop appears suitable with minor adjustments."
}`;

    console.log("Gemini schedule prompt:\n", schedulePrompt);
    const geminiResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: schedulePrompt }] }],
      generationConfig,
    });

    const resultText = geminiResponse.response.text();
    let scheduleData;
    try {
      scheduleData = JSON.parse(resultText);
    } catch (parseErr) {
      console.error("Failed to parse AI schedule response:", parseErr);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    // --- Part 2: Generate Weather Tips ---
    // Get weather data for the target date – for simplicity, using January 1 of the target year.
    const targetDate = `${year}-01-01`;
    const weatherData = await getWeatherData(area, targetDate);
    const weatherSummary = weatherData
      ? `Weather on ${weatherData.date}: ${weatherData.day.condition.text}, Avg Temp: ${weatherData.day.avgtemp_c}°C, Chance of rain: ${weatherData.day.daily_chance_of_rain}%.`
      : "Weather data not available.";

    // Build a task summary string from the schedule (excluding non-task keys)
    let taskSummary = "";
    for (const key in scheduleData) {
      if (
        [
          "country",
          "state",
          "district",
          "soil_type",
          "climate_condition",
          "crop_name",
          "year",
          "overall_note",
        ].includes(key)
      )
        continue;
      taskSummary += `${key}: ${scheduleData[key]}\n`;
    }

    const tipsPrompt = `You are an expert agricultural advisor. Given the following crop schedule and weather information, provide actionable weather-based tips for each task.

Crop Schedule:
${taskSummary}

Weather Info:
${weatherSummary}

Return your response in JSON format with a key "tips" containing an array of objects. Each object should have two keys:
- "task": The task name.
- "tip": One sentence of advice.

If a task does not require any adjustment based on the weather, reply with "No adjustment needed" for that task.

For example, if the crop schedule is:
{
  "sowing_start": "2027-06-15",
  "sowing_end": "2027-07-31",
  "irrigation_start": "2027-07-01",
  "irrigation_end": "2027-11-30"
}

And the weather info is:
"Weather on 2027-05-01: Partly cloudy, Avg Temp: 28°C, Chance of rain: 10%."

A sample response could be:
{
  "tips": [
    { "task": "sowing_start", "tip": "Delay sowing slightly if rain is expected." },
    { "task": "irrigation_start", "tip": "Increase irrigation frequency due to high temperatures." }
  ]
}`;

    console.log("Gemini tips prompt:\n", tipsPrompt);
    const tipsResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: tipsPrompt }] }],
      generationConfig,
    });
    const tipsResultText = tipsResponse.response.text();
    let tipsData;
    try {
      tipsData = JSON.parse(tipsResultText);
    } catch (parseErr) {
      console.error("Failed to parse AI tips response:", parseErr);
      return res.status(500).json({ error: "Invalid AI tips response format" });
    }

    // --- Part 3: Combine Results ---
    const finalResponse = {
      schedule: scheduleData,
      weatherTips: tipsData.tips || tipsData, // adapt if Gemini returns tips as a direct array
    };

    // Save finalResponse to an ephemeral directory (e.g., /tmp)
    const filePath = path.join("/tmp", "response.json");
    fs.writeFileSync(filePath, JSON.stringify(finalResponse, null, 2), "utf-8");
    console.log(`Saved final AI response (schedule + tips) to: ${filePath}`);

    res.json(finalResponse);
  } catch (error) {
    console.error("Error generating schedule and tips:", error);
    res.status(500).json({ error: "Failed to generate schedule" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
