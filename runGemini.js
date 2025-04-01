// const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Ensure you have a .env file with GEMINI_API_KEY

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

// // Function to get crop schedule based on input parameters
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
//     example: input :country: India,
// region: Gujarat,
// area: Ahmedabad,
// soil type: Black Soil,
// climate condition: Semi-Arid,
// crop name: Cotton,
// year: 2027
// output:
//   "country": "India",
//   "region": "Gujarat",
//   "district": "Ahmedabad",
//   "soil_type": "Black Soil",
//   "climate_condition": "Semi-Arid",
//   "crop_name": "Cotton",
//   "year": 2027,
//   "land_preparation_start": "2027-05-01",
//   "land_preparation_end": "2027-06-15",
//   "sowing_start": "2027-06-15",
//   "sowing_end": "2027-07-31",
//   "planting_start": "NA",
//   "planting_end": "NA",
//   "fertilization_1": "2027-07-15",
//   "fertilization_2": "2027-08-30",
//   "irrigation_start": "2027-07-01",
//   "irrigation_end": "2027-11-30",
//   "weeding_1": "2027-07-01",
//   "weeding_2": "2027-08-15",
//   "pest_control_1": "2027-08-01",
//   "pest_control_2": "2027-09-15",
//   "harvesting_start": "2027-11-01",
//   "harvesting_end": "2027-12-31"
// `;

//     // Call Gemini AI API with structured input
//     const response = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig,
//     });

//     // Extract and parse the JSON response
//     const result = response.response.text();
//     console.log("Generated Crop Schedule:", result);
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
//   "2025"
// );

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [],
  responseMimeType: "text/plain",
};

async function run() {
  const parts = [
    {
      text: "input: consider your the exper model developed for the farming and you need to create the crop schedule baced on following parameters. 1. Country: india , 2. Region: indian states (eg. maharashtra Karnataka etc), 3. Area: District of that state, 4. Soil type : soil type of that area, 5. Climate Condition: climate of that area., 6. Crop name: user wants to get schedules, 7. year: user wants schedule for which year. and note give the schedule in format of iso date format like yyyy-mm-dd and you need to give fix componets to return that decided first if any time any response parameter is empty then return NA eg. harvesting not needed return harvesting NA. and give me response in json format that can i call through api. for integration.",
    },
    { text: "output: Explanation of Fields:" },
    {
      text: "input: Role: advanced farmland planner. Input: region (e.g., Maharashtra), district (e.g., Solapur), soil type, climate condition, crop, and year. Provide a JSON-based schedule starting no earlier than January 1 of that year. Any step not required → “NA.” All dates = yyyy-mm-dd.",
    },
    { text: "output: Here's the generated JSON response:" },
    {
      text: "input: You are an Indian farming schedule generator. The user specifies year, region, district, soil type, climate, and crop. Output a JSON schedule (land prep, sowing, fertilizing, irrigating, weeding, pest control, harvesting). No tasks happen before Jan 1 of that year. If absent, “NA.” Use ISO date format.",
    },
    { text: "output: Example Scenario & JSON Output (Revised Logic)" },
    {
      text: "input: Pretend you’re a highly trained model for agricultural planning in India. A user wants a schedule for the upcoming year, with tasks only after January 1 of that year. Provide JSON fields (land_preparation, sowing, irrigation, fertilization, etc.). For anything irrelevant, write “NA.” Dates must be in YYYY-MM-DD.",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Maharashtra",\n  "district": "Solapur",\n  "soil_type": "Black",\n  "climate_condition": "Hot and Dry",\n  "crop_name": "Jowar",\n  "year": 2025,\n  "land_preparation_start": "2025-05-01",\n  "land_preparation_end": "2025-05-31",\n  "sowing_start": "2025-06-15",\n  "sowing_end": "2025-07-15",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2025-07-30",\n  "fertilization_2": "2025-08-30",\n  "irrigation_1": "2025-07-20",\n  "irrigation_2": "2025-08-20",\n  "weeding_1": "2025-07-10",\n  "weeding_2": "2025-08-10",\n  "pest_control_1": "2025-08-01",\n  "pest_control_2": "2025-09-01",\n  "harvesting_start": "2025-11-01",\n  "harvesting_end": "2025-11-30"\n}\n```',
    },
    {
      text: 'input: fix all parameters for all responses like sowing and planting if any crop not applicable return "NA.". eg response consider that and give all responses.\n```json\n{\n  "country": "India",\n  "region": "Maharashtra",\n  "district": "Solapur",\n  "soil_type": "Black",\n  "climate_condition": "Hot and Dry",\n  "crop_name": "Sugarcane",\n  "year": 2026,\n  "land_preparation_start": "2026-01-01",\n  "land_preparation_end": "2026-02-28",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "planting_start": "2026-03-01",\n  "planting_end": "2026-04-30",\n  "fertilization_1": "2026-05-15",\n  "fertilization_2": "2026-07-15",\n  "irrigation_start": "2026-03-01",\n  "irrigation_end": "2026-12-31",\n  "weeding_1": "2026-06-01",\n  "weeding_2": "2026-08-01",\n  "pest_control_1": "2026-07-01",\n  "pest_control_2": "2026-09-01",\n  "harvesting_start": "2027-01-01",\n  "harvesting_end": "2027-03-31"\n}\n```',
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Madhya Pradesh",\n  "district": "Indore",\n  "soil_type": "Black Cotton Soil",\n  "climate_condition": "Tropical Savanna Climate",\n  "crop_name": "Soybean",\n  "year": 2025,\n  "land_preparation_start": "2025-06-01",\n  "land_preparation_end": "2025-06-15",\n  "sowing_start": "2025-06-20",\n  "sowing_end": "2025-07-05",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1st_date": "2025-07-15",\n  "fertilization_2nd_date": "2025-08-15",\n  "irrigation_1st_date": "2025-07-01",\n  "irrigation_2nd_date": "2025-08-01",\n  "irrigation_3rd_date": "NA",\n  "weeding_1st_date": "2025-07-10",\n  "weeding_2nd_date": "2025-08-10",\n  "pest_control_1st_date": "2025-08-01",\n  "pest_control_2nd_date": "2025-09-01",\n  "harvesting_start": "2025-10-01",\n  "harvesting_end": "2025-10-31"\n}\n```',
    },
    {
      text: "input: country: india,\nregion:maharashtra,\narea:solapur,\nsoil type: black\nclimate condition: hot and dry\ncrop name: jowar\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Maharashtra",\n  "district": "Solapur",\n  "soil_type": "Black",\n  "climate_condition": "Hot and Dry",\n  "crop_name": "Jowar",\n  "year": 2025,\n  "land_preparation_start": "2025-05-01",\n  "land_preparation_end": "2025-05-31",\n  "sowing_start": "2025-06-15",\n  "sowing_end": "2025-07-15",\n  "fertilization_1st_date": "2025-07-30",\n  "fertilization_2nd_date": "2025-08-30",\n  "irrigation_1st_date": "2025-07-20",\n  "irrigation_2nd_date": "2025-08-20",\n  "irrigation_3rd_date": "NA",\n  "weeding_1st_date": "2025-07-10",\n  "weeding_2nd_date": "2025-08-10",\n  "pest_control_1st_date": "2025-08-01",\n  "pest_control_2nd_date": "2025-09-01",\n  "harvesting_start": "2025-11-01",\n  "harvesting_end": "2025-11-30"\n}\n```',
    },
    {
      text: "input: country: india,\nregion:maharashtra,\narea:solapur,\nsoil type: black\nclimate condition: hot and dry\ncrop name: jowar\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Maharashtra",\n  "district": "Solapur",\n  "soil_type": "Black",\n  "climate_condition": "Hot and Dry",\n  "crop_name": "Jowar",\n  "year": 2025,\n  "land_preparation_start": "2025-05-01",\n  "land_preparation_end": "2025-05-31",\n  "sowing_start": "2025-06-15",\n  "sowing_end": "2025-07-15",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2025-07-30",\n  "fertilization_2": "2025-08-30",\n  "irrigation_1": "2025-07-20",\n  "irrigation_2": "2025-08-20",\n  "weeding_1": "2025-07-10",\n  "weeding_2": "2025-08-10",\n  "pest_control_1": "2025-08-01",\n  "pest_control_2": "2025-09-01",\n  "harvesting_start": "2025-11-01",\n  "harvesting_end": "2025-11-30"\n}\n```',
    },
    {
      text: "input: country: india,\nregion:maharashtra,\narea:solapur,\nsoil type: black\nclimate condition: hot and dry\ncrop name: sugarcane\nyear: 2026",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Maharashtra",\n  "district": "Solapur",\n  "soil_type": "Black",\n  "climate_condition": "Hot and Dry",\n  "crop_name": "Sugarcane",\n  "year": 2026,\n  "land_preparation_start": "2026-01-01",\n  "land_preparation_end": "2026-02-28",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "planting_start": "2026-03-01",\n  "planting_end": "2026-04-30",\n  "fertilization_1": "2026-05-15",\n  "fertilization_2": "2026-07-15",\n  "irrigation_start": "2026-03-01",\n  "irrigation_end": "2026-12-31",\n  "weeding_1": "2026-06-01",\n  "weeding_2": "2026-08-01",\n  "pest_control_1": "2026-07-01",\n  "pest_control_2": "2026-09-01",\n  "harvesting_start": "2027-01-01",\n  "harvesting_end": "2027-03-31"\n}\n```',
    },
    {
      text: "input: country: india,\nregion:madiya pardesh MP,\narea:indore,\nsoil type: black cotton soil\nclimate condition: tropical savanna climate\ncrop name: soybean\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Madhya Pradesh",\n  "district": "Indore",\n  "soil_type": "Black Cotton Soil",\n  "climate_condition": "Tropical Savanna Climate",\n  "crop_name": "Soybean",\n  "year": 2025,\n  "land_preparation_start": "2025-06-01",\n  "land_preparation_end": "2025-06-15",\n  "sowing_start": "2025-06-20",\n  "sowing_end": "2025-07-05",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1st_date": "2025-07-15",\n  "fertilization_2nd_date": "2025-08-15",\n  "irrigation_1st_date": "2025-07-01",\n  "irrigation_2nd_date": "2025-08-01",\n  "irrigation_3rd_date": "NA",\n  "weeding_1st_date": "2025-07-10",\n  "weeding_2nd_date": "2025-08-10",\n  "pest_control_1st_date": "2025-08-01",\n  "pest_control_2nd_date": "2025-09-01",\n  "harvesting_start": "2025-10-01",\n  "harvesting_end": "2025-10-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Rajasthan,\narea: Jaipur,\nsoil type: Sandy,\nclimate condition: Arid,\ncrop name: Bajra,\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Rajasthan",\n  "district": "Jaipur",\n  "soil_type": "Sandy",\n  "climate_condition": "Arid",\n  "crop_name": "Bajra",\n  "year": 2025,\n  "land_preparation_start": "2025-06-01",\n  "land_preparation_end": "2025-06-30",\n  "sowing_start": "2025-07-01",\n  "sowing_end": "2025-07-15",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2025-07-30",\n  "fertilization_2": "NA",\n  "irrigation_1st_date": "2025-07-15",\n  "irrigation_2nd_date": "2025-08-15",\n  "irrigation_3rd_date": "NA",\n  "weeding_1st_date": "2025-08-01",\n  "weeding_2nd_date": "NA",\n  "pest_control_1st_date": "2025-08-15",\n  "pest_control_2nd_date": "NA",\n  "harvesting_start": "2025-10-01",\n  "harvesting_end": "2025-10-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Gujarat,\narea: Surat,\nsoil type: Black Soil,\nclimate condition: Tropical Wet and Dry,\ncrop name: Cotton,\nyear: 2027",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Gujarat",\n  "district": "Surat",\n  "soil_type": "Black Soil",\n  "climate_condition": "Tropical Wet and Dry",\n  "crop_name": "Cotton",\n  "year": 2027,\n  "land_preparation_start": "2027-05-01",\n  "land_preparation_end": "2027-06-15",\n  "sowing_start": "2027-06-15",\n  "sowing_end": "2027-07-31",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2027-07-15",\n  "fertilization_2": "2027-08-30",\n  "irrigation_start": "2027-07-01",\n  "irrigation_end": "2027-11-30",\n  "weeding_1": "2027-07-01",\n  "weeding_2": "2027-08-15",\n  "pest_control_1": "2027-08-01",\n  "pest_control_2": "2027-09-15",\n  "harvesting_start": "2027-11-01",\n  "harvesting_end": "2027-12-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Assam,\narea: Dibrugarh,\nsoil type: Acidic Loam,\nclimate condition: Humid Subtropical,\ncrop name: Tea,\nyear: 2026",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Assam",\n  "district": "Dibrugarh",\n  "soil_type": "Acidic Loam",\n  "climate_condition": "Humid Subtropical",\n  "crop_name": "Tea",\n  "year": 2026,\n  "land_preparation_start": "NA",\n  "land_preparation_end": "NA",\n  "planting_start": "2026-01-01",\n  "planting_end": "2026-03-31",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "fertilization_1": "2026-04-15",\n  "fertilization_2": "2026-07-15",\n  "fertilization_3": "2026-10-15",\n  "irrigation_start": "2026-01-01",\n  "irrigation_end": "2026-12-31",\n  "weeding_1": "2026-03-01",\n  "weeding_2": "2026-06-01",\n  "weeding_3": "2026-09-01",\n  "pest_control_1": "2026-05-01",\n  "pest_control_2": "2026-08-01",\n  "harvesting_start": "2026-04-01",\n  "harvesting_end": "2026-12-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Uttarakhand,\narea: Nainital,\nsoil type: Sandy Loam,\nclimate condition: Temperate,\ncrop name: Apple,\nyear: 2028",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Uttarakhand",\n  "district": "Nainital",\n  "soil_type": "Sandy Loam",\n  "climate_condition": "Temperate",\n  "crop_name": "Apple",\n  "year": 2028,\n  "land_preparation_start": "2028-01-01",\n  "land_preparation_end": "2028-03-31",\n  "planting_start": "2028-01-01",\n  "planting_end": "2028-03-31",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "fertilization_1": "2028-04-15",\n  "fertilization_2": "2028-06-15",\n  "irrigation_start": "2028-04-01",\n  "irrigation_end": "2028-09-30",\n  "weeding_1": "2028-05-01",\n  "weeding_2": "2028-07-01",\n  "pest_control_1": "2028-06-01",\n  "pest_control_2": "2028-08-01",\n  "harvesting_start": "2028-09-01",\n  "harvesting_end": "2028-10-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: West Bengal,\narea: Bardhaman,\nsoil type: Clay,\nclimate condition: Humid Subtropical,\ncrop name: Mustard,\nyear: 2026",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "West Bengal",\n  "district": "Bardhaman",\n  "soil_type": "Clay",\n  "climate_condition": "Humid Subtropical",\n  "crop_name": "Mustard",\n  "year": 2026,\n  "land_preparation_start": "2026-10-15",\n  "land_preparation_end": "2026-11-15",\n  "sowing_start": "2026-11-15",\n  "sowing_end": "2026-12-01",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2027-01-01",\n  "fertilization_2": "2027-01-15",\n  "irrigation_start": "2026-12-15",\n  "irrigation_end": "2027-02-15",\n  "weeding_1": "2027-01-05",\n  "weeding_2": "NA",\n  "pest_control_1": "2027-01-20",\n  "pest_control_2": "NA",\n  "harvesting_start": "2027-02-15",\n  "harvesting_end": "2027-03-15"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Tamil Nadu,\narea: Thanjavur,\nsoil type: Alluvial,\nclimate condition: Tropical Monsoon,\ncrop name: Paddy (Rice),\nyear: 2024",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Tamil Nadu",\n  "district": "Thanjavur",\n  "soil_type": "Alluvial",\n  "climate_condition": "Tropical Monsoon",\n  "crop_name": "Paddy (Rice)",\n  "year": 2024,\n  "land_preparation_start": "2024-01-01",\n  "land_preparation_end": "2024-01-31",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "planting_start": "2024-02-15",\n  "planting_end": "2024-03-15",\n  "fertilization_1": "2024-03-30",\n  "fertilization_2": "2024-05-01",\n  "irrigation_start": "2024-02-15",\n  "irrigation_end": "2024-06-30",\n  "weeding_1": "2024-04-15",\n  "weeding_2": "2024-05-15",\n  "pest_control_1": "2024-04-01",\n  "pest_control_2": "2024-05-01",\n  "harvesting_start": "2024-07-01",\n  "harvesting_end": "2024-07-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Andhra Pradesh,\narea: Guntur,\nsoil type: Red Soil,\nclimate condition: Tropical Wet and Dry,\ncrop name: Chilli,\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Andhra Pradesh",\n  "district": "Guntur",\n  "soil_type": "Red Soil",\n  "climate_condition": "Tropical Wet and Dry",\n  "crop_name": "Chilli",\n  "year": 2025,\n  "land_preparation_start": "2025-01-01",\n  "land_preparation_end": "2025-02-28",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "planting_start": "2025-03-01",\n  "planting_end": "2025-03-31",\n  "fertilization_1st_date": "2025-04-15",\n  "fertilization_2nd_date": "2025-05-15",\n  "irrigation_1st_date": "2025-03-01",\n  "irrigation_2nd_date": "2025-06-01",\n  "irrigation_3rd_date": "2025-08-01",\n  "weeding_1st_date": "2025-04-01",\n  "weeding_2nd_date": "2025-06-01",\n  "pest_control_1st_date": "2025-05-01",\n  "pest_control_2nd_date": "2025-07-01",\n  "harvesting_start": "2025-09-01",\n  "harvesting_end": "2025-10-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Karnataka,\narea: Mysuru,\nsoil type: Laterite,\nclimate condition: Tropical Wet,\ncrop name: Ragi,\nyear: 2025",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Karnataka",\n  "district": "Mysuru",\n  "soil_type": "Laterite",\n  "climate_condition": "Tropical Wet",\n  "crop_name": "Ragi",\n  "year": 2025,\n  "land_preparation_start": "2025-05-01",\n  "land_preparation_end": "2025-06-15",\n  "sowing_start": "2025-06-16",\n  "sowing_end": "2025-07-01",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2025-07-15",\n  "fertilization_2": "2025-08-15",\n  "irrigation_1st_date": "2025-07-01",\n  "irrigation_2nd_date": "2025-08-01",\n  "irrigation_3rd_date": "2025-09-01",\n  "weeding_1": "2025-07-08",\n  "weeding_2": "2025-08-08",\n  "pest_control_1": "2025-08-01",\n  "pest_control_2": "2025-09-01",\n  "harvesting_start": "2025-11-01",\n  "harvesting_end": "2025-12-15"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Goa,\narea: North Goa,\nsoil type: Sandy Loam,\nclimate condition: Tropical Monsoon,\ncrop name: Cashew,\nyear: 2026",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Goa",\n  "district": "North Goa",\n  "soil_type": "Sandy Loam",\n  "climate_condition": "Tropical Monsoon",\n  "crop_name": "Cashew",\n  "year": 2026,\n  "land_preparation_start": "2026-01-15",\n  "land_preparation_end": "2026-02-15",\n  "planting_start": "2026-06-01",\n  "planting_end": "2026-07-15",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "fertilization_1st": "2026-08-15",\n  "fertilization_2nd": "2026-11-15",\n  "irrigation_start": "2026-10-01",\n  "irrigation_end": "2026-12-31",\n  "weeding_1st": "2026-09-01",\n  "weeding_2nd": "2026-12-01",\n  "pest_control_1st": "2026-07-01",\n  "pest_control_2nd": "2026-10-01",\n  "harvesting_start": "2026-12-01",\n  "harvesting_end": "2027-01-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Himachal Pradesh,\narea: Shimla,\nsoil type: Loamy,\nclimate condition: Temperate,\ncrop name: Apple,\nyear: 2027",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Himachal Pradesh",\n  "district": "Shimla",\n  "soil_type": "Loamy",\n  "climate_condition": "Temperate",\n  "crop_name": "Apple",\n  "year": 2027,\n  "land_preparation_start": "2027-01-01",\n  "land_preparation_end": "2027-03-31",\n  "sowing_start": "NA",\n  "sowing_end": "NA",\n  "planting_start": "2027-01-01",\n  "planting_end": "2027-03-31",\n  "fertilization_1": "2027-04-15",\n  "fertilization_2": "2027-06-15",\n  "irrigation_start": "2027-04-01",\n  "irrigation_end": "2027-09-30",\n  "weeding_1": "2027-05-01",\n  "weeding_2": "2027-07-01",\n  "pest_control_1": "2027-06-01",\n  "pest_control_2": "2027-08-01",\n  "harvesting_start": "2027-09-01",\n  "harvesting_end": "2027-10-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Gujarat,\narea: Ahmedabad,\nsoil type: Black Soil,\nclimate condition: Semi-Arid,\ncrop name: Cotton,\nyear: 2027",
    },
    {
      text: 'output: ```json\n{\n  "country": "India",\n  "region": "Gujarat",\n  "district": "Ahmedabad",\n  "soil_type": "Black Soil",\n  "climate_condition": "Semi-Arid",\n  "crop_name": "Cotton",\n  "year": 2027,\n  "land_preparation_start": "2027-05-01",\n  "land_preparation_end": "2027-06-15",\n  "sowing_start": "2027-06-15",\n  "sowing_end": "2027-07-31",\n  "planting_start": "NA",\n  "planting_end": "NA",\n  "fertilization_1": "2027-07-15",\n  "fertilization_2": "2027-08-30",\n  "irrigation_start": "2027-07-01",\n  "irrigation_end": "2027-11-30",\n  "weeding_1": "2027-07-01",\n  "weeding_2": "2027-08-15",\n  "pest_control_1": "2027-08-01",\n  "pest_control_2": "2027-09-15",\n  "harvesting_start": "2027-11-01",\n  "harvesting_end": "2027-12-31"\n}\n```',
    },
    {
      text: "input: country: India,\nregion: Odisha,\narea: Cuttack,\nsoil type: Alluvial,\nclimate condition: Tropical Savanna,\ncrop name: Rice,\nyear: 2028",
    },
    { text: "output: " },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
  });
  // TODO: Following code needs to be updated for client-side apps.
  const candidates = result.response.candidates;
  for (
    let candidate_index = 0;
    candidate_index < candidates.length;
    candidate_index++
  ) {
    for (
      let part_index = 0;
      part_index < candidates[candidate_index].content.parts.length;
      part_index++
    ) {
      const part = candidates[candidate_index].content.parts[part_index];
      if (part.inlineData) {
        try {
          const filename = `output_${candidate_index}_${part_index}.${mime.extension(
            part.inlineData.mimeType
          )}`;
          fs.writeFileSync(
            filename,
            Buffer.from(part.inlineData.data, "base64")
          );
          console.log(`Output written to: ${filename}`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  console.log(result.response.text());
}

run();
