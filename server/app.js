const express = require("express");
const app=express();
const cors=require("cors");
const helmet=require("helmet");
const morgan=require("morgan");
const yup=require("yup");
const { nanoid }=require("nanoid");
const db = require('monk')('mongodb+srv://yelpcamp:zied24934500@cluster0.rysp3.mongodb.net/<dbname>?retryWrites=true&w=majority');
const urls = db.get('urls');
urls.createIndex({ slug: 1 }, { unique: true });

let schema = yup.object().shape({
    slug:yup.string().trim().matches(/[\w\-]/i),
    url:yup.string().trim().url().required(),
  });

// middle wares:
//============
// app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json());
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(allowCrossDomain);
 
//============



app.post("/url",async (req,res,next)=>{
    let {slug , url }=req.body;
    try {

       
        await schema.validate({
            slug,url
        });
        if(!slug){
            slug=nanoid(5);
        }
        slug=slug.toLowerCase();
        const existing= await urls.findOne({ slug });
        if(existing){
            throw new Error("Slug in Use")
        }
        

        const newUrl={
            url,slug

        }
        console.log(newUrl)
        const created = await urls.insert(newUrl);
    res.json(created);

        
    } catch (error) {
        next(error);
        
    }
})
app.get("/:id",async (req,res,error)=>{
const {id: slug}= req.params;
try {
    const foundUrl= await urls.findOne({slug});
    if(foundUrl){
        res.redirect(foundUrl.url);
    }else{
        res.redirect("/?error=Not Found");
    }
} catch (error) {
    res.redirect("/?error=Not Found");
}
})

app.use((error,req,res,next)=>{
    if (error.status) {
        res.status(error.status);
      } else {
        res.status(500);
      }
    res.json({
        message:error.message,
    })
})
if(process.env.NODE_ENV === 'production'){
    app.use(express.static(__dirname+'/public'))
    app.get(/.*/,(req,res)=>{
        res.sendFile(__dirname+'/public/index.html')
    })
}

app.listen(3000,()=>{
    console.log("listening to port 3000");
})