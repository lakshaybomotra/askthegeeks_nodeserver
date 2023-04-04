const express = require("express");
let cors = require("cors");
const app = express();
const bodyparser = require("body-parser");
const session = require("express-session");
const fs = require("fs");
let date_ob = new Date();
const multer = require("multer");
const firebsae = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } = require("firebase/storage");
const mysql = require("mysql");

const conn = mysql.createConnection({
  host: "db4free.net",
  user: "askthegeeksadmin",
  password: "askthegeeks@21",
  database: "askthegeeksdb",
});

conn.connect(function (error) {
  if (error) throw error;

  console.log("Connection Created");
});

app.use(bodyparser.json());

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); 

app.use(express.static("views"));
app.use(express.static("public"));
app.use(express.static("files"));
app.use(cors());
app.use(express.urlencoded({ extended: false }));

const firebaseConfig = {
  apiKey: "AIzaSyD3vdGbqLBmtJU4vM7tOQPKy_zndgC-WO4",
  authDomain: "askthegeeksnode.firebaseapp.com",
  projectId: "askthegeeksnode",
  storageBucket: "askthegeeksnode.appspot.com",
  messagingSenderId: "553229281119",
  appId: "1:553229281119:web:1dab7bd214c4a1c7a6b8ea"
};

firebsae.initializeApp(firebaseConfig);

const storage = getStorage();

const upload = multer({ storage: multer.memoryStorage() });

app.post("/admin-login-action", function (req, res) {
  console.log(req.body);

  let { email, password } = req.body;

  let sqlSelect = "SELECT * FROM `admintable` WHERE email='" + email + "'";
  conn.query(sqlSelect, (err, row) => {
    if (err) throw err;

    console.log(row.length);
    if (row.length > 0) {
      if (row[0].password !== password) {
        res.send("invalidpassword");
      } else {
        session.admin = row[0].email;
        console.log(session);
        res.send(row[0].email);
      }
    } else {
      res.send("invalidemail");
    }
  });
});

app.get("/get-admin-type", function (req, res) {
  let email = req.query.email;

  let selectSQL = "SELECT admintype FROM `admintable` WHERE email='" + email + "'";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data[0].admintype);
    console.log(data[0].admintype);
  });
});

app.post("/add-ad", upload.single("file"), async (req, res) => {
  try {
      const dateTime = giveCurrentDateTime();

      const storageRef = ref(storage, `files/${req.file.originalname + "       " + dateTime}`);

      // Create file metadata including the content type
      const metadata = {
          contentType: req.file.mimetype,
      };

      // Upload the file in the bucket storage
      const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
      //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

      // Grab the public url
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('File successfully uploaded.');
      const adurl = "req.body.adurl";
      let sql = "UPDATE `advertisement` SET `sr`='1',`ad_image`='"+ downloadURL +"',`ad_url`='"+ adurl +"' WHERE 1";
      // let sql = "UPDATE `advertisement` SET `sr`='1',`ad_url`='" + adurl + "`,'ad_image`='" + downloadURL + "' WHERE 1";
      conn.query(sql, (err, result) => {
        if (err) throw err;
          res.send("Ad Added...");
        });
  } catch (error) {
      return res.status(400).send(error.message)
  }
});

app.post("/upload",upload.single("profile"), async (req, res) => {
  try {
    const dateTime = giveCurrentDateTime();
  const folderName = session.username;
  const storageRef = ref(storage, `files/${folderName+ '/' + req.file.originalname + " " + dateTime}`);

  // Create file metadata including the content type
  const metadata = {
    contentType: req.file.mimetype,
  };

  // Upload the file in the bucket storage
  const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);

  let update =
          "UPDATE `members` SET `photo`='" +
          downloadURL +
          "' WHERE `username`='" +
          folderName +
          "'";
        conn.query(update, function (error) {
          if (error) throw error;

          console.log("Photo set");
        });
        res.status(200).send({ message: "File Uploaded", code: 200 });
  } catch (err) {
    console.error(err);
  }
});

app.post("/update-action", function (req, res) {
  let { fullname, mobile, admintype } = req.body;
  let email = req.body.email;

  if (email === "" || fullname === "" || mobile === "" || admintype === "") {
    res.send("required");
  } else {
    let update =
      "UPDATE `admintable` SET `fullname`='" +
      fullname +
      "'," +
      "`mobile`='" +
      mobile +
      "', `admintype`='" +
      admintype +
      "' WHERE `email`='" +
      email +
      "'";
    conn.query(update, function (error) {
      if (error) throw error;

      res.send("User Details Updated Successfully");
    });
  }
});

app.post("/update-category", function (req, res) {
  let { name, description } = req.body;

  if (name === "" || description === "") {
    res.send("required");
  } else {
    let update =
      "UPDATE `category` SET `category_name`='" +
      name +
      "'," +
      "`description`='" +
      description +
      "' WHERE `category_name`='" +
      name +
      "'";
    conn.query(update, function (error) {
      if (error) throw error;

      res.send("Category Updated Successfully");
    });
  }
});

app.post("/update-member", function (req, res) {
  console.log(req.body);
  let { fullname, mobile, bio, email } = req.body;

  if (fullname === "" || bio === "" || mobile === "") {
    res.send("required");
  } else {
    let update =
      "UPDATE `members` SET `member_name`='" +
      fullname +
      "'," +
      "`mobile`='" +
      mobile +
      "', `description`='" +
      bio +
      "' WHERE `email`='" +
      email +
      "'";
    conn.query(update, function (error) {
      if (error) throw error;

      res.send("User Details Updated Successfully");
    });
  }
});

app.get("/get-member-status", function (req, res) {
  let username = req.query.username;

  let selectSQL = "SELECT status FROM `members` WHERE username='" + username + "'";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data[0].status);
    console.log(data[0].status);
  });
});

app.post("/update-password", function (req, res) {
  console.log(req.body);
  let { email, password } = req.body;

  if (password === "") {
    res.send("required");
  } else {
    let update =
      "UPDATE `admintable` SET `password`='" +
      password +
      "' WHERE `email`='" +
      email +
      "'";
    conn.query(update, function (error) {
      if (error) throw error;

      res.send("User Password Updated Successfully");
    });
  }
});

app.post("/change-member-password", function (req, res) {
  let { currentpass, newpass, username } = req.body;

  let select = "SELECT * FROM members WHERE username='" + username + "'";
  conn.query(select, function (error, data) {
    console.log("db pass", data[0].password);
    console.log(currentpass);
    if (error) throw error;

    if (data[0].password === currentpass) {
      let sql =
        "UPDATE `members` SET `password`='" +
        newpass +
        "' WHERE `username`='" +
        username +
        "'";
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("Password updated...");
      });
    } else {
      res.send("Current password wrong");
    }
  });
});

app.get("/delete-email", function (req, res) {
  let email = req.query.email;

  let deleteSQL = "DELETE FROM admintable WHERE email='" + email + "'";
  conn.query(deleteSQL, function (err) {
    if (err) throw err;

    res.send("User Deleted");
  });
});

app.get("/delete-category", function (req, res) {
  console.log(req.query);
  let categoryname = req.query.category;

  let deleteSQL =
    "DELETE FROM category WHERE category_name='" + categoryname + "'";
  conn.query(deleteSQL, function (err) {
    if (err) throw err;

    res.send("Category Deleted");
  });
});

app.get("/ban-user", function (req, res) {
  console.log(req.query);
  let username = req.query.username;
  console.log(username);

  let select = "SELECT status FROM members WHERE username='" + username + "'";
  conn.query(select, function (error, data) {
    if (error) throw error;

    if (data[0].status==='active') {
      let sql = "UPDATE `members` SET `status`='banned' WHERE username='" + username + "'";
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("banned");
      });
    }
    else if(data[0].status==='banned'){
      let sql = "UPDATE `members` SET `status`='active' WHERE username='" + username + "'";
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("active");
      });
    }
  });
});

app.get("/get-user-details", function (req, res) {
  let email = req.query.email;

  let selectSQL = "SELECT * FROM `admintable` WHERE email='" + email + "'";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});

app.get("/get-member-details", function (req, res) {
  let username = req.query.username;

  let selectSQL = "SELECT * FROM `members` WHERE username='" + username + "'";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});

app.get("/get-all-members", function (req, res) {

  let selectSQL = "SELECT * FROM `members`";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});

app.get("/get-member-questions", function (req, res) {
  let username = req.query.username;

  let selectSQL =
    "SELECT * FROM `questions` WHERE username='" +
    username +
    "' Order By date_of_posting Desc LIMIT 3";
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
  });
});

app.get("/send-data", function (req, res) {
  let selectSQL = "SELECT * FROM `admintable`";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    // res.send([]);
  });
});

app.get("/fetch-category", function (req, res) {
  let selectSQL = "SELECT * FROM `category`";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.get("/fetch-category-data", function (req, res) {
  let name = req.query.name;
  let selectSQL = "SELECT * FROM `category` WHERE `category_name`='"+name+"'";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.get("/fetch-questions", function (req, res) {
  let selectSQL = "SELECT *, members.photo FROM questions JOIN members ON questions.username = members.username Order By qid Desc";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.get("/fetch-trend-questions", function (req, res) {
  let selectSQL = "SELECT * FROM `questions` Order By qid Desc LIMIT 3";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.get("/fetch-advertisement", function (req, res) {
  let selectSQL = "SELECT * FROM `advertisement`";

  conn.query(selectSQL, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});



app.get("/fetch-question-details", function (req, res) {
  console.log(req.query);
  let qid = req.query.qid;
  let test = "SELECT *, members.photo FROM questions JOIN members ON questions.username = members.username WHERE qid='" + qid + "'";
  
  // let selectSQL = "SELECT * FROM `questions` WHERE qid='" + qid + "'";

  // conn.query("SELECT * FROM `signup`", function (err, data) {
  conn.query(test, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.get("/fetch-answer-details", function (req, res) {
  console.log(req.query);
  let qid = req.query.qid;
  let testa = "SELECT *, members.photo FROM answers JOIN members ON answers.member_id = members.username WHERE question_id='" + qid + "' Order By votes Desc"
  // let selectSQL = "SELECT * FROM `answers` WHERE question_id='" + qid + "' Order By votes Desc";

  conn.query(testa, function (err, data) {
    if (err) throw err;
    res.send(data);
    console.log(data);
    // res.send([]);;
  });
});

app.post("/upvote", function (req, res) {
  let cond = "true";
  let id = req.query.id;
  let select = "SELECT * FROM answers WHERE id='" + id + "'";
  conn.query(select, function (error, data) {
    if (error) throw error;

    let form = req.body;
    let votes = data[0].votes+1;
    console.log("Votes ",data[0].votes);
    if (cond==="true") {
      let sql = "UPDATE `answers` SET `votes`='" +
      votes +
      "' WHERE `id`='" +
      id +
      "'";;
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("upvoted");
      });
    } 
  });
});


app.post("/downvote", function (req, res) {
  let cond = "true";
  let id = req.query.id;
  let select = "SELECT * FROM answers WHERE id='" + id + "'";
  conn.query(select, function (error, data) {
    if (error) throw error;

    let form = req.body;
    let votes = data[0].votes-1;
    console.log("Votes ",data[0].votes);
    if (cond==="true") {
      let sql = "UPDATE `answers` SET `votes`='" +
      votes +
      "' WHERE `id`='" +
      id +
      "'";;
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("downvoted");
      });
    } 
  });
});

app.post("/logout", function (req, res) {
  session.username = undefined;
  res.send("loggedout");
});

app.get("/check-session", function (req, res) {
  const check = session.username;
  console.log(check);
  if (session.username != undefined) {
    let selectSQL = "SELECT * FROM `members` WHERE username='" + check + "'";
    conn.query(selectSQL, function (err, data) {
      if (err) throw err;
      res.send(data);
    });
  } else {
    res.send("notloggedin");
  }
});


app.get("/view", function (req, res) {
  res.redirect("view.html");
});

app.post("/register-action", function (req, res) {
  let email = req.body.email;

  let select = "SELECT * FROM admintable WHERE email='" + email + "'";
  conn.query(select, function (error, row) {
    if (error) throw error;

    let form = req.body;
    if (row.length === 0) {
      let sql = `INSERT INTO admintable(email, password, fullname, mobile, admintype) VALUES ('${form.email}', '${form.password}', '${form.fullname}', '${form.mobile}', '${form.admintype}')`;
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("Post added...");
      });
    } else {
      res.send("duplicate");
    }
  });
});

app.post("/member-register-action", function (req, res) {
  const file = req.files.file;
  console.log(req.files);
  console.log(req.body);
  let username = req.body.username;
  let select = "SELECT * FROM members WHERE username='" + username + "'";
  conn.query(select, function (error, row) {
    if (error) throw error;

    let form = req.body;
    if (row.length === 0) {
      const folderName = __dirname + "/public/images/" + form.username;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
      const newpath = folderName + "/";
      const filename = "profile.jpg";
      file.mv(`${newpath}${filename}`, (err) => {
        if (err) {
        console.log("Error in profile pic");
        }
        console.log("Profile pic uploaded");
      });
      let sql = `INSERT INTO members (username,member_name,description,photo,mobile,email,password,ranking) VALUES ('${form.username}', '${form.member_name}', '${form.description}', 'profile.jpg', '${form.mobile}', '${form.email}', '${form.password}', '0');`;
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("Member added...");
      });
    } else {
      res.send("duplicate");
    }
  });
});

app.post("/add-category", function (req, res) {
  let category = req.body.category;

  let select = "SELECT * FROM category WHERE category_name='" + category + "'";
  conn.query(select, function (error, row) {
    if (error) throw error;

    let form = req.body;
    if (row.length === 0) {
      let sql = `INSERT INTO category(category_name, description) VALUES ('${form.category}', '${form.description}')`;
      conn.query(sql, (err, result) => {
        if (err) throw err;
        res.send("Category added...");
      });
    } else {
      res.send("duplicate");
    }
  });
});

app.post("/add-question", function (req, res) {
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();

  let currentDate = year + "-" + month + "-" + date;

  let form = req.body;
  let sql = `INSERT INTO questions(title,description,date_of_posting,status,category_name,username ) VALUES ("${form.title}", "${form.description}","${currentDate}","active", "${form.category}", "${form.member_username}" )`;
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.send("Question added...");
  });
});

app.post("/add-answer", function (req, res) {
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();

  let currentDate = year + "-" + month + "-" + date;

  let form = req.body;
  console.log(req.body);
  let sql = `INSERT INTO answers(solution,date,question_id,member_id) VALUES ('${form.solution}','${currentDate}','${form.question_id}', '${form.member_id}' )`;
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.send("Answer added...");
  });
});

app.post("/login-action", function (req, res) {
  console.log(req.body);

  let { username, password } = req.body;

  let sqlSelect = "SELECT * FROM `members` WHERE username='" + username + "'";
  conn.query(sqlSelect, (err, row) => {
    if (err) throw err;

    console.log(row.length);
    if (row.length > 0) {
      console.log(row[0].password);
      if (row[0].password !== password) {
        res.send("invalidpassword");
      } else {
        session.username = row[0].username;
        console.log(session);
        res.send(row[0].username);
      }
    } else {
      res.send("invalidusername");
    }
  });
});

app.get("/registration-post", function (req, res) {
  res.redirect("registerPOST.html");
});

app.get("/registration", function (req, res) {
  res.redirect("register.html");
});

app.get("/ajax", function (req, res) {
  // res.send('Response from Node Server.');
  res.redirect("ajax.html");
});

app.get("/", function (req, res) {
  // res.send('Response from Node Server.');
  res.redirect("index.html");
});

app.get("/about", function (req, res) {
  res.send("Hello");
});

app.get("/contact", function (req, res) {
  // res.send('Contact Page');
  res.write("Hello");
  res.write("John");
  res.write("How Are You");
  res.end();
});

const giveCurrentDateTime = () => {
  const today = new Date();
  const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + ' ' + time;
  return dateTime;
}
