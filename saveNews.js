import addFinalNews from "./del/getNewsFinal-Producer.js";

import workerFinal from "./Queue/getNewsFinal-worker.js";

import workerRaw from "./del/getNewsRaw-Worker.js";


async function saveNews() {
  try {
    await addFinalNews();
    console.log("Final news tasks added successfully.");

    // Optionally, you can also start the workers here if they are not started elsewhere
    workerFinal.run();
    workerRaw.run(); 
  } catch (error) {
    console.error("Error adding final news tasks:", error);
  }
}