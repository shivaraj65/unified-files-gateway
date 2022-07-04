//jshint esversion:8
const express=require("express");
const http = require('http');
const bodyParser = require('body-parser');
const path= require("path");
const  cors = require('cors');
const shortid = require('shortid');
const  hash = require("js-sha512");
const uuid = require('uuid');
const AWS = require('aws-sdk');
const azure = require('azure-storage');
const keys = require("./keys.js");

const app=express();
app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({limit: '50mb', extended: false, parameterLimit:50000}));
// app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.json({ extended: false, limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }));

// ------------------------configuration of cors----------------------
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

// ------------------------configuration of AWS----------------------
AWS.config.update({
  region: keys.aws.region,
  accessKeyId:keys.aws.accessKeyId,
  secretAccessKey: keys.aws.secretAccessKey
});
const dbUsers=keys.dbUsers;
const dbFiles=keys.dbFiles;
const dbSharedFile=keys.dbSharedFile;
const bucketName=keys.bucketName;
const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({ params: {Bucket: bucketName} });

// ------------------------configuration of AZURE---------------------
const STORAGE_ACCOUNT_NAME = keys.STORAGE_ACCOUNT_NAME;
const ACCOUNT_ACCESS_KEY = keys.ACCOUNT_ACCESS_KEY;
const blobSvc = azure.createBlobService(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
const containerName = keys.containerName;


app.options('/signup', cors());
app.post("/signup", function(req,res){
      var params = {
          TableName: dbUsers,
          Item: {
              'user_id': "UID_"+shortid.generate(),
              'id': req.body.Email,
              'password': hash(""+req.body.Password),
              'name': req.body.Name,
          }
      };
		ddb.put(params, function(err, data) {
			if (err) {
          res.send("Some Error or Account already Exist!");
          console.log(err);
			} else {
			    res.send("success!");
      }
		});
});

app.options('/login', cors());
app.post("/login", function(req,res){
  var params = {
		TableName: dbUsers,
		Key:{
			"id":""+req.body.Email
		}
	};
  ddb.get(params, function(err, val) {
        if(err){
            res.send("error");
        }else{
            if(val.Item!=null){
                if(val.Item.password== hash(""+req.body.Password)){
                    res.send(val.Item);
                }else{
                  res.send("userID or Password is incorrect. try again");
                }
            }else{
                res.send("There is no account associated to this ID");
            }
        }
    });
});

app.options('/upload', cors());
app.post("/upload", function(req,res){
  const provider = req.body.provider;
  let servertime =new Date();
  if(provider=="AWS"){
      const s3name=uuid.v4();
      const contextType=req.body.type;
      const buf = Buffer.from(req.body.file.replace(/^data:(.*,)?/, ""),'base64');
      const type = req.body.file.split(';')[0].split('/')[1];
      let data={
         Key: s3name+"."+type,
         Body: buf,
         ContentEncoding: 'base64',
         ContentType: contextType
      };
      s3.upload(data, (err, data) => {
       if (err) {
         res.send("something went wrong!");
       }
       else{
         var params = {
             TableName: dbFiles,
             Item: {
                 'id': s3name+"."+type,
                 'fileName': req.body.fileName,
                 'storedName':s3name+"."+type,
                 'location':bucketName+"/"+s3name+"."+type,
                 'user_ID': req.body.id,
                 'provider': provider,
                 'timestamp': ""+servertime,
                 'lastModifiedBy':req.body.email
             }
         };
         ddb.put(params, function(err, data) {
           if (err) {
                res.send("file not stored at DB");
           } else {
               res.send("uploaded");
            }
         });
       }
      });
  }else if(provider=="AZURE"){
    const blobFileName=uuid.v4();
    const buf = Buffer.from(req.body.file.replace(/^data:(.*,)?/, ""),'base64');
    const type = req.body.file.split(';')[0].split('/')[1];
    blobSvc.createBlockBlobFromText(containerName, blobFileName+"."+type, buf, {
           contentSettings: { contentType: type }
       }, (error, result, response) => {
           if (error){
             res.send("something went wrong");
           }else{
             var params = {
                 TableName: dbFiles,
                 Item: {
                     'id': blobFileName+"."+type,
                     'fileName': req.body.fileName,
                     'storedName':blobFileName+"."+type,
                     'location':containerName+"/"+blobFileName+"."+type,
                     'user_ID': req.body.id,
                     'provider': provider,
                     'timestamp': ""+servertime,
                     'lastModifiedBy':req.body.email
                 }
             };
             ddb.put(params, function(err, data) {
               if (err) {
                    res.send("file not stored at DB");
               } else {
                   res.send("uploaded");
                }
             });

           }
       });
  }else{
    res.send("Select proper cloud provider!");
  }
});

app.options('/update', cors());
app.post("/update",async function(req,res){
  let access=0;
  if(req.body.accessType=="owner"){
    access=1;
  }else{
      let servertime = await  Date.now();
      let timestamp = await new Date(req.body.timestamp).getTime();
      if(servertime < timestamp){
        access=1;
      }else{
        res.send("access expired");
      }
  }
  if(req.body.provider==="AWS" && access===1){
    const s3name=req.body.storedFileName;
    const contextType=req.body.type;
    const buf = Buffer.from(req.body.file.replace(/^data:(.*,)?/, ""),'base64');
    const type = req.body.file.split(';')[0].split('/')[1];
    let data={
       Key: s3name,
       Body: buf,
       ContentEncoding: 'base64',
       ContentType: contextType
    };
    s3.upload(data, (err, data) => {
     if (err) {
       res.send("something went wrong! file not updated");
     }
     else{
       const params = {
        TableName: dbFiles,
        Key: {
            "id": req.body.storedFileName
        },
        UpdateExpression: "set #variable1 = :x, #MyVariable = :y",
        ExpressionAttributeNames: {
            "#variable1": "lastModifiedBy",
            "#MyVariable":"timestamp"
        },
        ExpressionAttributeValues: {
            ":x": req.body.email,
            ":y": ""+new Date()
        }
      };
      ddb.update(params, function(err, data) {
         if (err) {
           res.send("file updated. DB record failed");
         }
         else{
           res.send("updated!");
         }
      });
     }
    });
  }else if(req.body.provider==="AZURE" && access===1){
    const blobFileName=req.body.storedFileName;
    const buf = Buffer.from(req.body.file.replace(/^data:(.*,)?/, ""),'base64');
    const type = req.body.file.split(';')[0].split('/')[1];
    blobSvc.createBlockBlobFromText(containerName, blobFileName, buf, { contentSettings: { contentType: type }}, (error, result, response) => {
           if (error){
             res.send("something went wrong");
           }else{
             const params = {
              TableName: dbFiles,
              Key: {
                  "id": req.body.storedFileName
              },
              UpdateExpression: "set #variable1 = :x, #MyVariable = :y",
              ExpressionAttributeNames: {
                  "#variable1": "lastModifiedBy",
                  "#MyVariable":"timestamp"
              },
              ExpressionAttributeValues: {
                  ":x": req.body.email,
                  ":y": ""+new Date()
              }
            };
            ddb.update(params, function(err, data) {
               if (err) {
                 res.send("file updated. DB record failed");
               }
               else{
                 res.send("updated!");
               }
            });
           }
       });
  }
});

app.options('/delete', cors());
app.post("/delete", function(req,res){
  const data1 = {
       TableName: dbSharedFile,
       FilterExpression: "#d = :value",
       ExpressionAttributeNames: {
           "#d": "storedFileName"
       },
       ExpressionAttributeValues: {
            ":value": req.body.fileName
       }
   };
   ddb.scan(data1, function(err,data){
       if (err) {
           res.send("failed to load data");
       } else {
         for(let i=0;i<data.Count;i++){
           let data2={
             TableName: dbSharedFile,
             Key: {
                'id':data.Items[i].id
              }
            };
           ddb.delete(data2, function(err,data){
              if (err) { res.send("error!");}
           });
          }
       }
   });
  if(req.body.provider=="AWS"){
    let params = {
          Key: req.body.fileName,
    };
    s3.deleteObject(params, function(err,data){
        if (err) {
            res.send("failed");
        } else {
            let data={
              TableName: dbFiles,
              Key: {
                  'id':req.body.fileName
              }
            };
            ddb.delete(data, function(err,data){
                if (err) {
                    res.send("file deleted, DB query crashed!");
                } else {
                    res.send("deleted");
                }
            });
        }
    });
  }else if(req.body.provider=="AZURE"){
    blobSvc.deleteBlobIfExists(containerName, req.body.fileName, (err, result) => {
    if(err) {
       res.send("failed");
    }else{
      let data={
        TableName: dbFiles,
        Key: {
            'id':req.body.fileName
        }
      };
      ddb.delete(data, function(err,data){
          if (err) {
              res.send("file deleted, DB query crashed!");
          } else {
              res.send("deleted");
          }
      });
    }
 });
  }else{
    res.send("Select proper cloud provider!");
  }
});

app.options('/view', cors());
app.post("/view", function(req,res){
  var params = {
       TableName: dbFiles,
       FilterExpression: "#d = :value",
       ExpressionAttributeNames: {
           "#d": "user_ID"
       },
       ExpressionAttributeValues: {
            ":value": req.body.id
       }
   };
   ddb.scan(params, function(err,data){
       if (err) {
           res.send("failed to load data");
       } else {
           res.send(data);
       }
   });
});

app.options('/download', cors());
app.post("/download",async function(req,res){
  if(req.body.accessType=="owner"){
    if(req.body.provider=="AWS"){
        let params = { Key: req.body.fileName };
        let fileStream = s3.getObject(params).createReadStream();
        fileStream.pipe(res);
    }else if(req.body.provider=="AZURE"){
      let fileStream = blobSvc.createReadStream(containerName, req.body.fileName, (err, res) => {if(err) {}});
      fileStream.pipe(res);
    }else{
      res.send("Select proper cloud provider!");
    }
  }else{
    let servertime = await Date.now();
    let timestamp = await new Date(req.body.timestamp).getTime();    
    if(servertime < timestamp){
      if(req.body.provider=="AWS"){
          let params = { Key: req.body.fileName };
          let fileStream = s3.getObject(params).createReadStream();
          fileStream.pipe(res);
      }else if(req.body.provider=="AZURE"){
        let fileStream = blobSvc.createReadStream(containerName, req.body.fileName, (err, res) => {if(err) {}});
        fileStream.pipe(res);
      }else{
        res.send("Select proper cloud provider!");
      }
    }else{
      res.status(405);
      res.send("expired");
    }
  }
});

app.options('/share', cors());
app.post("/share",function(req,res){
  var params = {
      TableName: dbSharedFile,
      Item: {
          'id': uuid.v4(),
          'sharedFrom':req.body.shareFrom,
          'sharedTo':req.body.shareTo,
          'provider':req.body.provider,
          'actualFileName':req.body.actualFileName,
          'storedFileName':req.body.storedFileName,
          'sharedTillDate':req.body.sharedTillDate,
          'sharedTillTime':req.body.sharedTillTime,
          'shareTillTimestamp':req.body.sharedTillDate+" "+req.body.sharedTillTime+" "+req.body.timezone
      }
  };
  ddb.put(params, function(err, data) {
    if (err) {
         res.send("error");
    } else {
        res.send("success");
     }
  });
});

app.options('/sharedList', cors());
app.post("/sharedList",function(req,res){
  var params = {
       TableName: dbSharedFile,
       FilterExpression: "#d = :value",
       ExpressionAttributeNames: {
           "#d": req.body.filterExpression
       },
       ExpressionAttributeValues: {
            ":value": req.body.id
       }
   };
   ddb.scan(params, function(err,data){
       if (err) {
           res.send("failed to load data");
       } else {
           res.send(data);
       }
   });
});

app.options('/revoke', cors());
app.post("/revoke", function(req,res){
  let data={
    TableName: dbSharedFile,
    Key: { 'id':req.body.id }
  };
  ddb.delete(data, function(err,data){
      if (err) {
          res.send("Error");
      } else {
          res.send("success");
      }
  });
});

app.listen(process.env.PORT || 3001, function(){
  console.log("Server started on port 3001");
});
