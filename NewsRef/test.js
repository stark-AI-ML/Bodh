// function subtractISO(iso1, iso2) {
//   // Convert ISO strings to Date objects
//   const d1 = new Date(iso1);
//   const d2 = new Date(iso2);

//   // Get difference in milliseconds
//   const diffMs = d1.getTime() - d2.getTime();

//   // Return multiple units for convenience
//   return {
//     milliseconds: diffMs,
//     seconds: diffMs / 1000,
//     minutes: diffMs / (1000 * 60),
//     hours: diffMs / (1000 * 60 * 60),
//   };
// }

// // Example usage:
// const t1 = "2026-05-12T21:48:02Z";
// const t2 = "2026-05-12T20:48:02Z";

// console.log(subtractISO(t1, t2));

// // { milliseconds: 3600000, seconds: 3600, minutes: 60, hours: 1 }

// function isoDurationToSecondsAscii(iso) {
//   let hours = 0,
//     minutes = 0,
//     seconds = 0;
//   let num = 0;

//   for (let i = 0; i < iso.length; i++) {
//     const code = iso.charCodeAt(i) - 48;

//     if (code >= 0 && code <= 9) {
//       num = num * 10 + code;
//     } else {
//       const ch = iso[i];
//       if (ch === "H") hours = num;
//       else if (ch === "M") minutes = num;
//       else if (ch === "S") seconds = num;
//       num = 0;
//     }
//   }

//   return { hours: hours, minutes: minutes, seconds: seconds };
// }

// console.log(isoDurationToSecondsAscii("PT1H10M22S")); // 4222

const now = new Date();
const dateOnly = now.toISOString().split("T")[0];

console.log(dateOnly);
