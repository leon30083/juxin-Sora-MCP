#!/usr/bin/env node

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function testRegularVideo() {
  try {
    const response = await client.createVideo({
      prompt: "a cat walking under cherry blossoms",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: []
    });

    console.log("Regular video creation successful!");
    console.log("Task ID:", response.id);
    console.log("Status:", response.status);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testRegularVideo();