const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const databasePath = path.join(__dirname, "financepeer.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("listening to port 3001");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = password === databaseUser.password;
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/blog/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      blog;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

app.post("/save/", async (request, response) => {
  const { id, title, body, userId } = request.body;
  const saveBlogQuery = `INSERT INTO blog(id, title, body, userid) values(${id}, ${title}, ${body}, ${userId})`;
  await db.run(saveBlogQuery);
  response.send("Blog added successfully");
});

app.post("/saveblogs/", async (request, response) => {
  const blogsData = request.body;
  let values = [];
  let blogDataString = blogsData
    .map(
      (each) => `(${each.id}, '${each.title}', '${each.body}', ${each.userId})`
    )
    .join(", ");
  const saveBlogQuery =
    `INSERT INTO blog(id, title, body, userid) values ` + blogDataString;
  await db.run(saveBlogQuery);
  response.send("Blogs Data added successfully");
});

module.exports = app;
