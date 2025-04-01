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
const fetch = require("node-fetch"); // Ensure you have installed node-fetch: npm install node-fetch
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

// --- Endpoint: Generate Crop Schedule ---
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

    const schedulePrompt = `You are an expert agricultural advisor for Indian agriculture. 
Given the following parameters:
Country: ${country}
State: ${region}
District: ${area}
Soil Type: ${soil}
Climate Condition: ${climate}
Crop Name: ${cropName}
Target Year: ${year}

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

All dates must be in ISO format (YYYY-MM-DD). Any task that is not applicable should be set to "NA".

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
  "land_preparation_end": "2027-06-15",
  "sowing_start": "2027-06-15",
  "sowing_end": "2027-07-31",
  "irrigation_start": "2027-07-01",
  "irrigation_end": "2027-11-30",
  "fertilization_1": "2027-07-15",
  "fertilization_2": "2027-08-30",
  "weeding_1": "2027-07-01",
  "weeding_2": "2027-08-15",
  "pest_control_1": "2027-08-01",
  "pest_control_2": "2027-09-15",
  "harvesting_start": "2027-11-01",
  "harvesting_end": "2027-12-31"
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

    // Save scheduleData to /tmp directory (ephemeral storage)
    const filePath = path.join("/tmp", "response.json");
    fs.writeFileSync(filePath, JSON.stringify(scheduleData, null, 2), "utf-8");
    console.log(`Saved AI schedule to: ${filePath}`);

    res.json(scheduleData);
  } catch (error) {
    console.error("Error generating schedule:", error);
    res.status(500).json({ error: "Failed to generate schedule" });
  }
});

// --- Endpoint: Generate Weather Tips ---
app.post("/generate-weather-tips", async (req, res) => {
  try {
    const { schedule, weatherInfo } = req.body;
    if (!schedule || !weatherInfo) {
      return res
        .status(400)
        .json({ error: "Missing required fields: schedule and weatherInfo" });
    }

    // Build a task summary string from the schedule by excluding non-task keys.
    let taskSummary = "";
    for (const key in schedule) {
      if (
        [
          "country",
          "state",
          "district",
          "soil_type",
          "climate_condition",
          "crop_name",
          "year",
        ].includes(key)
      )
        continue;
      taskSummary += `${key}: ${schedule[key]}\n`;
    }

    const tipsPrompt = `You are an expert agricultural advisor. Given the following crop schedule and weather information, provide actionable weather-based tips for each task.

Crop Schedule:
${taskSummary}

Weather Info:
${weatherInfo}

Return your response in JSON format with a key "tips" containing an array of objects. Each object should have two keys:
- "task": The task name.
- "tip": One sentence of advice.

If a task does not require any adjustment based on the weather, reply with "No adjustment needed" for that task.

Example output:
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

    res.json(tipsData);
  } catch (error) {
    console.error("Error generating weather tips:", error);
    res.status(500).json({ error: "Failed to generate weather tips" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
