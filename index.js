import express from 'express';
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import mongoose from "mongoose";
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "./user.model.js";

const secret = 'secret123';
const saltRounds = 10;
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors(
    {
        origin: "*", // allow to server to accept request from different origin
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true // allow session cookie from browser to pass through
    }
));


const uri = "mongodb+srv://memegenerator:meme123@memedb.mcp5u.mongodb.net/memedb?retryWrites=true&w=majority";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, () => {
  console.log("db connnected");
});

mongoose.connection.on('error', error => console.log(error));
mongoose.Promise = global.Promise;

app.get('/', (req, res) => {
  res.send('ok');
});

app.post('/register', (req, res) => {
    const { email, username } = req.body;
    const password = bcrypt.hashSync(req.body.password, saltRounds, (err) => {
        console.long(err);
    });
  const user = new User({email,username,password});
  user.save().then(user => {
    jwt.sign({id:user._id}, secret, (err, token) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
          res.status(201).json({'token': token}).send();
        }
    });
}).catch(e => {
    console.log(e);
    res.sendStatus(500);
});
});

app.post('/user', (req, res) => {
  const token = req.body.token;
  // console.log({token});
  const userInfo = jwt.verify(token, secret);
    User.findById(userInfo.id)
      .then(user => {
        res.json({username:user.username});
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });

});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    User.findOne({username}).then(user => {
        if (user && user.username) {
            const passOk = bcrypt.compareSync(password, user.password);
            if (passOk) {
                jwt.sign({id:user._id}, secret, (err, token) => {
                    res.json({'token': token}).send();
                });
      } else {
        res.status(422).json({'token': ''});
      }
    } else {
      res.status(422).json({'token': ''});
    }
  });
});

app.post("/get-memes", (req, res) => {
  const { username } = req.body;
  console.log(username)
  User.findOne({ username }).then((user) => {

    if (!user)
    {
      console.log("user undefined")
      res.status(500).send();
    }
    else {
      console.log(user.memesurl);
      res.status(200).send(user.memesurl);
    }
  })
})

app.post("/savememe", (req, res) => {
  const { username, memeurl } = req.body;
  
    console.log(username, memeurl)
    User.findOne({ username }).then(
        (user) => {
        // console.log(user)
        if (user) {
            let doesUrlExist = false;
            for (let i = 0; i < user.memesurl.length; i++)
                if (user.memesurl[i] === memeurl)
                    doesUrlExist = true;
            
            if(!doesUrlExist)
            user.memesurl.push(memeurl);
            
            user
                .save()
                .then(() => {
                    res.sendStatus(200).send("saved meme")
                })
                .catch((err) => {
                    console.log(err);
                    res.sendStatus(500).send("error occured");
                });
        }
    })
})

app.post('/logout', (req, res) => {
  res.json({'token': ''}).send();
});


app.listen(5000, () => {
    console.log("app started");
});