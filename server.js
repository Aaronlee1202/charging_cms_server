//載入 server 程式所需要的相關套件

var express = require('express')
var app = express()
var cors = require('cors')
var bodyParser = require('body-parser')
var morgan = require('morgan')
var mongoose = require('mongoose')
//載入 jwt函式庫
var jwt = require('jsonwebtoken')
//載入設定
var config = require('./config')
//載入資料模型
var User = require('./app/models/user')

var port = process.env.PORT || 3000
// mongoose.connect(config.database)
mongoose.connect('mongodb://localhost/jwt_dev')
app.set('secret', config.secret)

//套用 middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(morgan('dev'))
app.use(cors())

app.get('/', function(req, res){
    res.send('Hi, The API is at http://localhost:' + port + '/api')
})


app.get('/setup', function(req, res) {
    var andyyou = new User({
        name: 'andyyou',
        password: '12345678',
        admin: true
    })
    andyyou.save(function (err) {
        if (err) throw err

        console.log('User saved successfully')
        res.json({success: true})
    })
})

var api = express.Router()
// TODO: authenticate
// TODO: verify token

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
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authenticate failed. Wrong password'})
            }else {
                var token = jwt.sign({user}, app.get('secret'), {
                    expiresIn: 60*60*24
                })

                res.json({
                    success: true,
                    message: 'Enjoy your token',
                    token: token,
                })
            }
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