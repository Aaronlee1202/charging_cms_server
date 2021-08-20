//載入 server 程式所需要的相關套件
var express = require('express')
var app = express()
var cors = require('cors')
// var bodyParser = require('body-parser')
var morgan = require('morgan')
var mongoose = require('mongoose')
//載入 jwt函式庫
var jwt = require('jsonwebtoken')
//載入設定
var config = require('./config')
//載入資料模型
var User = require('./app/models/user')
//加密
var bcrypt = require('bcryptjs');

var port = process.env.PORT || 3000
// mongoose.connect(config.database)
mongoose.connect('mongodb://localhost/jwt_dev')
app.set('secret', config.secret) //自訂密鑰

//套用 middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(morgan('dev'))
app.use(cors())

app.get('/', function(req, res){
    res.send('Hi, The API is at http://localhost:' + port + '/api')
})

// saltRounds: 整數型態，數值越高越安全。
// myPassword: 要加密的字串。
// testPassword: 測試驗證密碼的變數。
// myHash: myPassword加密後結果(給驗證用)

var api = express.Router()
// TODO: authenticate
// TODO: verify token
api.post('/signUp', function(req, res) {
    //加密 sync同步寫法
    bcrypt.hash(req.body.password, 10).then(function (pwHash) {

        // bcrypt.hashSync(req.body.password, 10)
        var andyyou = new User({
            name: req.body.name,
            password: pwHash,
            admin: true
        })
        andyyou.save(function (err) {
            if (err) throw err
    
            console.log('User saved successfully')
            res.json({success: true})
        })
    });
})

api.get('/', function (req, res) {
    res.json({message: 'Welcome to the APIs'})
})


//無須被 middleware 驗證
api.post('/authenticate', function(req, res) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err

        if (!user) {
            res.json({ success: false, message: 'Authenticate failed. User not found'})
        }else if (user) {
            // user.password != req.body.password
            console.log('DB password:', user.password);
            console.log('re password:', req.body.password);
            // bcrypt.hash(req.body.password, 10, function(err, hash) {
            //     if (err) {throw (err);}
            //     bcrypt.compare(req.body.password, hash).then(hashRes => {
            //         console.log('hashRes:', hashRes);
            //     })
            // })
                bcrypt.compare(req.body.password, user.password).then(hash => {
                    console.log('Hash:', hash);
                    if (!hash) {
                        res.json({ success: false, message: 'Authenticate failed. Wrong password'})
                    }else {
                        var token = jwt.sign({user}, app.get('secret'), {
                            // algorithm / noTimestamp
                            expiresIn: 60*60*24 //過期時間
                        })
        
                        res.json({
                            success: true,
                            message: 'Enjoy your token',
                            token: token,
                        })
                    }
                })

        }
    })
})

//middleware 擺放的位置會影響是否要驗證，要驗證的路由必須要 middleware 之後
api.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['token']
    if (token) {
        jwt.verify(token, app.get('secret'), function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'})
            } else {
                req.decoded = decoded
                next()
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        })
    }
})
api.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users)
    })
})

app.use('/api', api)

app.listen(port, function() {
    console.log('The server is running at http://localhost:' + port)
})