const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

//
const http = require("http");
//

app.prepare().then(async () => {
  const server = express();
  const httpServer = http.createServer(server);

  // Scheduler
  const runScheduler = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/scheduler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      console.log(response);
    } catch (error) {
      console.log(error.message);
    }
  };

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    runScheduler();
  });
});
