import data from "./mockData.js";

// INSERT INTO news_all (
//     headline,
//     summary,
//     category,
//     impact_scope,
//     importance_score,
//     sentiment,
//     tags,
//     entities,
//     state_id,
//     district_id,
//     broadcast_date
// )

// VALUES (
//     'Government announces new infrastructure project',
//     'A major highway expansion project has been approved.',
//     'Infrastructure',
//     'State',
//     8,
//     'Positive',
//     '["roads","development","budget"]',
//     '{
//         "people":["Prime Minister"],
//         "organizations":["NHAI"]
//     }',
//     NULL,
//     NULL,
//     CURRENT_DATE
// );

async function saveToDb(json) {
  console.log(json);
}

async function sendJsonLinear(json_all) {
  for (let i = 0; i < json_all.length; i++) {
    await saveToDb(json_all[i]);
  }
}

sendJsonLinear(data);
