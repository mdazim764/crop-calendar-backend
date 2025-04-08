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
const fetch = require("node-fetch"); // Ensure you have installed: npm install node-fetch
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

// Helper: Generate location defaults using Gemini
async function generateLocationDefaults(country, state, city) {
  const locationPrompt = `You are an expert in Indian agriculture and geographical conditions. Given the following location details:
- Country: ${country}
- State: ${state}
- District/City: ${city}

Provide the most common soil type and climate condition for this area, formatted as JSON:
{
  "soil": "SoilType",
  "climate": "ClimateCondition"
}

Ensure that the values are descriptive (for example, "Alluvial", "Tropical", "Red", "Semi-Arid", etc.).`;
  console.log("Location defaults prompt:\n", locationPrompt);
  try {
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: locationPrompt }] }],
      generationConfig,
    });
    const resultText = response.response.text();
    let locationData;
    try {
      locationData = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse location defaults response:", parseError);
      locationData = { soil: "Unknown Soil", climate: "Unknown Climate" };
    }
    return locationData;
  } catch (error) {
    console.error("Error generating location defaults:", error);
    return { soil: "Unknown Soil", climate: "Unknown Climate" };
  }
}

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
    const { country, region, area, cropName, year } = req.body;
    if (!country || !region || !area || !cropName || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get soil and climate defaults automatically from Gemini.
    const { soil, climate } = await generateLocationDefaults(
      country,
      region,
      area
    );
    console.log(
      `For location ${area}, ${region}, ${country} -> Soil: ${soil}, Climate: ${climate}`
    );

    // --- Build Gemini Schedule Prompt ---
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

For each task, also provide two additional keys:
- "description_<task>": A brief description of what the task involves.
- "tips_<task>": A one-sentence actionable tip based on general weather conditions.

Finally, include an overall key "overall_note" that briefly explains whether the crop is suitable for the given conditions.

All dates must be in ISO format (YYYY-MM-DD). For any task that is not applicable, return "NA."

Pretend you’re a highly trained model for agricultural planning in India. A user wants a schedule for the upcoming year, with tasks only after January 1 of that year. Provide JSON fields for tasks (land_preparation, sowing, irrigation, fertilization, etc.). For any task that is not relevant, return "NA."

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
  "description_land_preparation_start": "Begin clearing and preparing the land for plowing.",
  "tips_land_preparation_start": "Ensure the soil is adequately moist before starting.",
  "land_preparation_end": "2027-06-15",
  "description_land_preparation_end": "Finish leveling and final land preparation.",
  "tips_land_preparation_end": "No adjustment needed.",
  "sowing_start": "2027-06-15",
  "description_sowing_start": "Start sowing the cotton seeds at proper depth.",
  "tips_sowing_start": "Delay sowing if heavy rains are forecast.",
  "sowing_end": "2027-07-31",
  "description_sowing_end": "Complete the sowing process ensuring even seed distribution.",
  "tips_sowing_end": "Monitor for pest emergence after sowing.",
  "irrigation_start": "2027-07-01",
  "description_irrigation_start": "Begin scheduled irrigation to support seed germination.",
  "tips_irrigation_start": "Increase irrigation if temperatures are high.",
  "irrigation_end": "2027-11-30",
  "description_irrigation_end": "End regular irrigation as the crop nears maturity.",
  "tips_irrigation_end": "Reduce irrigation frequency as harvest nears.",
  "fertilization_1": "2027-07-15",
  "description_fertilization_1": "Apply the first round of fertilizers to boost early growth.",
  "tips_fertilization_1": "Apply fertilizer after the first weeding.",
  "fertilization_2": "2027-08-30",
  "description_fertilization_2": "Apply a second dose to sustain growth.",
  "tips_fertilization_2": "Use organic fertilizer for sustained growth.",
  "weeding_1": "2027-07-01",
  "description_weeding_1": "Perform initial weeding to remove competing plants.",
  "tips_weeding_1": "Perform weeding early to reduce competition with crops.",
  "weeding_2": "2027-08-15",
  "description_weeding_2": "Carry out a second round of weeding for optimal growth.",
  "tips_weeding_2": "Monitor for invasive species and act accordingly.",
  "pest_control_1": "2027-08-01",
  "description_pest_control_1": "Begin pest control measures to protect young plants.",
  "tips_pest_control_1": "Implement integrated pest management strategies.",
  "pest_control_2": "2027-09-15",
  "description_pest_control_2": "Follow up with a second pest control application if needed.",
  "tips_pest_control_2": "Inspect regularly and adjust treatments as necessary.",
  "harvesting_start": "2027-11-01",
  "description_harvesting_start": "Initiate harvesting once crops are mature.",
  "tips_harvesting_start": "Harvest early in the morning for best quality.",
  "harvesting_end": "2027-12-31",
  "description_harvesting_end": "Complete the harvesting process and secure the produce.",
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

    // Optionally, save scheduleData to /tmp for debugging.
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
// (This endpoint remains unchanged as it’s not used in the current update.)
app.post("/generate-weather-tips", async (req, res) => {
  try {
    const { schedule, weatherInfo } = req.body;
    if (!schedule || !weatherInfo) {
      return res
        .status(400)
        .json({ error: "Missing required fields: schedule and weatherInfo" });
    }

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
      console.log("Parsed tips data:", tipsData);
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

// --- Endpoint: Generate Weather Impacts ---
app.post("/generate-weather-impacts", async (req, res) => {
  try {
    const { currentWeather, upcomingTasksSummary } = req.body;

    if (!currentWeather || !upcomingTasksSummary) {
      return res.status(400).json({
        error:
          "Missing required fields: currentWeather and upcomingTasksSummary",
      });
    }

    // --- Build Gemini Weather Impact Prompt ---
    const weatherImpactPrompt = `You are an expert agricultural advisor for Indian farming conditions.
Given the following current weather data and upcoming tasks summary:

Current Weather:
- Location: ${currentWeather.location?.name || "Unknown"}, ${
      currentWeather.location?.region || "Unknown"
    }
- Condition: ${currentWeather.current?.condition?.text || "N/A"}
- Temperature: ${currentWeather.current?.temp_c || "N/A"}°C
- Precipitation (mm): ${currentWeather.current?.precip_mm || "N/A"}
- Humidity: ${currentWeather.current?.humidity || "N/A"}%
- Wind Speed (kph): ${currentWeather.current?.wind_kph || "N/A"}

Upcoming Tasks Summary (next few days):
${upcomingTasksSummary}

Analyze the *current* weather conditions and determine their *immediate potential impact* on the listed upcoming tasks. Focus specifically on adverse effects or necessary adjustments farmers should consider *right now* due to the *current* weather.

Provide the response as a JSON object containing a single key "impacts", which is an array of strings. Each string should be a concise, actionable impact statement or warning. If the current weather poses no significant threat or requires no immediate adjustments for the listed tasks, return an empty array or a single message stating that conditions are favorable.

Example Input snippet:
Current Weather: ... Temp: 36°C, Precip: 0mm ...
Upcoming Tasks Summary: Sowing Maize in Pune on 2025-04-08

Example Output:
{
  "impacts": [
    "High temperature (36°C) may stress young seedlings during sowing; ensure adequate soil moisture.",
    "Consider sowing during cooler parts of the day (early morning/late evening) due to heat."
  ]
}

Example Output (Favorable):
{
  "impacts": [
    "Current weather conditions appear favorable for the scheduled tasks."
  ]
}

Generate the JSON output:`;

    console.log("--- Sending Weather Impact Prompt to Gemini ---");
    // console.log(weatherImpactPrompt); // Uncomment for debugging the full prompt

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: weatherImpactPrompt }] }],
      generationConfig, // Use the same config defined earlier
    });

    const responseText = result.response.text();
    console.log("--- Received Weather Impact Response from Gemini ---");
    console.log(responseText);

    try {
      // Attempt to parse the JSON string from Gemini
      const impactsData = JSON.parse(responseText);
      if (!impactsData.impacts || !Array.isArray(impactsData.impacts)) {
        console.error(
          "Gemini response for impacts is not in the expected format:",
          impactsData
        );
        // Provide a default fallback if parsing is okay but structure is wrong
        return res.json({
          impacts: ["Could not determine specific impacts from AI analysis."],
        });
      }
      res.json(impactsData); // Send the parsed JSON { "impacts": [...] }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Raw Gemini response text:", responseText); // Log the raw text for debugging
      // Provide a fallback if JSON parsing fails
      res
        .status(500)
        .json({ impacts: ["Error parsing AI response for weather impacts."] });
    }
  } catch (error) {
    console.error("Error in /generate-weather-impacts endpoint:", error);
    res.status(500).json({
      error: "Failed to generate weather impacts",
      details: error.message,
    });
  }
});

// --- New Endpoint: Generate General Weather Impacts ---
app.post("/generate-general-weather-impacts", async (req, res) => {
  console.log(
    "Received request body in /generate-general-weather-impacts:",
    req.body
  );
  try {
    const { currentWeather } = req.body;

    if (!currentWeather) {
      return res.status(400).json({
        error: "Missing required field: currentWeather",
      });
    }

    // --- Build Gemini General Weather Impact Prompt ---
    const generalWeatherImpactPrompt = `You are an expert agricultural advisor for Indian farming conditions.
Given the following current weather data:

Current Weather:
- Location: ${currentWeather.location?.name || "Unknown"}, ${
      currentWeather.location?.region || "Unknown"
    }
- Condition: ${currentWeather.current?.condition?.text || "N/A"}
- Temperature: ${currentWeather.current?.temp_c || "N/A"}°C
- Precipitation (mm): ${currentWeather.current?.precip_mm || "N/A"}
- Humidity: ${currentWeather.current?.humidity || "N/A"}%
- Wind Speed (kph): ${currentWeather.current?.wind_kph || "N/A"}

Analyze the *current* weather conditions and determine their *general potential impact* on farming activities. Focus specifically on adverse effects or general recommendations farmers should consider *right now* due to the *current* weather.

Provide the response as a JSON object containing a single key "impacts", which is an array of strings. Each string should be a concise, actionable impact statement or warning. If the current weather poses no significant general threat or requires no immediate general adjustments, return an empty array or a single message stating that conditions are generally favorable.

Example Output:
{
  "impacts": [
    "Consider checking drainage systems due to potential heavy rainfall.",
    "High temperatures may require increased watering for most crops."
  ]
}

Generate the JSON output:`;

    console.log("--- Sending General Weather Impact Prompt to Gemini ---");
    // console.log(generalWeatherImpactPrompt); // Uncomment for debugging the full prompt

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: generalWeatherImpactPrompt }] },
      ],
      generationConfig, // Use the same config defined earlier
    });

    const responseText = result.response.text();
    console.log("--- Received General Weather Impact Response from Gemini ---");
    console.log(responseText);

    try {
      const impactsData = JSON.parse(responseText);
      if (!impactsData.impacts || !Array.isArray(impactsData.impacts)) {
        console.error(
          "Gemini response for general impacts is not in the expected format:",
          impactsData
        );
        return res.json({
          impacts: ["Could not determine general impacts from AI analysis."],
        });
      }
      res.json(impactsData);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Raw Gemini response text:", responseText);
      res.status(500).json({
        impacts: ["Error parsing AI response for general weather impacts."],
      });
    }
  } catch (error) {
    console.error(
      "Error in /generate-general-weather-impacts endpoint:",
      error
    );
    res.status(500).json({
      error: "Failed to generate general weather impacts",
      details: error.message,
    });
  }
});

// Make sure your app.listen is after all route definitions
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
