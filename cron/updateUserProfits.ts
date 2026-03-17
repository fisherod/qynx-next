import "dotenv/config";
import { getDb } from "@/lib/mongodb";
import { ROI_DAILY } from "@/constants";

async function updateUserProfitsOnce() {
  const db = await getDb();

  const users = await db.collection("users").find({}).toArray();

  for (const user of users) {
    const usdBalance = Number(user.usdBalance ?? 0);
    if (!Number.isFinite(usdBalance) || usdBalance <= 0) {
      continue;
    }

    const delta = usdBalance * ROI_DAILY;
    if (!Number.isFinite(delta) || delta <= 0) {
      continue;
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $inc: { profit: delta },
        $set: { updatedAt: new Date() }
      }
    );
  }
}

updateUserProfitsOnce()
  .then(() => {
    console.log("✅ Daily user profits updated (development cron run)");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error updating user profits", err);
    process.exit(1);
  });
