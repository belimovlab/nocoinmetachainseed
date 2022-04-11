let NoCoinMetaChainFullNode = {
    is_local : true,
    port     : 44401,
    
    fs     : undefined,
    io     : undefined,
    http   : undefined,
    addres : undefined,
    app    : undefined,
    parser : undefined,
    chproc : undefined,
    redis  : undefined,
    axios  : undefined,
    crypto : undefined,
    Rmongo : undefined,
    mongo  : undefined,
    
    nodeList : [],
    
    main_info : {
      started_at : '',  
      ip_address : '',  
      domain     : 'https://nocoinmeta.com',  
      port       : 44400,
      used_nodes : 0
    },
    allowed_methods : [
        'rpc_info',
        'rpc_version',
        'rpc_get_nodes',
        'rpc_new_node',
        'rpc_status'
    ],
    
    //=========================================================================
    rpc_info    : function(res, data, request_id){
        let _this = this;
        _this.send_success(res, _this.main_info, request_id);
    },
    rpc_version : function(res, data, request_id){
        let _this = this;
        _this.send_success(res,{
            version : 1
        }, request_id);
    },
    rpc_status  : function(res, data, request_id){
        let _this = this;
        _this.send_success(res,{
            server_status : true
        }, request_id);
    },
    //=========================================================================
    send_error   : function(res, data){
        let error = {
            status      : 'error',
            error_code  : data.hasOwnProperty('error_code') ? data.error_code : 1001,
            message     : data.hasOwnProperty('message') ? data.message : 'Unknown error!'  
        };
        res.jsonp(error);
        return;
    },
    send_success : function(res, data, request_id){
        let _this = this;
        let response = {
            status     : 'success',
            timestamp  : _this.get_timestamp(),
            hash       : '',
            request_id : request_id,
            data      : {
                response : Math.random() * Math.random()
            }
        };
        response.data = Object.assign(response.data, data);
        response.hash = _this.crypto.createHash('sha256', data.id)
                        .update(JSON.stringify(response.data))
                        .digest('hex');
                
        res.jsonp(response);
        return;
    },
    get_timestamp : function(){
        return Math.floor(Date.now()/1000);
    },
    
    test : async function(){
        let _this = this;
        
        let start = Date.now();
        
        let test_col = _this.mongo.db('test');
       
        let data = [];
       
       
       
     
        const collection = test_col.collection("blocks");
        
        
        

        
        
        
        
      /*
        for(let i = 0; i < 100000; i ++)
        {
            console.log('Item #'+i.toString()+ ' writing...');
            
            var myobj = {
                "status": "success",
             
            };
            
            data.push(myobj);
            
        }
        
       
        await collection.insertMany(data, function(err, res) {
            if (err) throw err;
            console.log("Number of documents inserted: " + res.insertedCount);
            console.log(res);
        });
        
        
         */
        
        
        collection.countDocuments(function(err, result){

            if(err){ 
                return console.log(err);
            }
            console.log(`В коллекции users ${result} документов`);
   
        });
        
       
       
       
       
       
        
        
    },
    
    mongo_start : async function(){
        let _this = this;
        _this.mongo = new _this.Rmongo("mongodb://localhost:27017/");
        try {
            await _this.mongo.connect();
            const db = _this.mongo.db("admins");
           
            const result = await db.command({ ping: 1 });
            console.log("MongoDB connected...");
            console.log(result);
        }catch(err) {
            console.log("MongoDB error.");
            console.log(err);
            process.exit();
        } finally {
            // Закрываем подключение при завершении работы или при ошибке
            //await _this.mongo.close();
            console.log("MongoDB closed");
        }

        
    },
    start_fullnode : function(){
        let _this = this;
        
        
        _this.fs     = require('fs');
        _this.crypto = require('crypto');
        _this.app    = require('express')();
        _this.cors   = require('cors');
        _this.parser = require('body-parser');
        _this.chproc = require('child_process');
        _this.redis  = require('redis');
        _this.client = _this.redis.createClient();
        _this.axios  = require('axios');
        _this.app.use(_this.cors());
        _this.app.use(_this.parser.urlencoded({ extended: false }));
        _this.app.use(_this.parser.json());
        _this.Rmongo = require("mongodb").MongoClient;
 
        if(_this.is_local === true)
        {
            //======================================================================
            //                      LOCAL
            //======================================================================
            _this.address  = 'localhost';
            _this.stat_server = 'https://localhost/';
            const  options = {};
            _this.http     = require('http').createServer(options,_this.app); 
            _this.axios_http  = require('https');
        }
        else
        {
            //======================================================================
            //                      SERVER
            //======================================================================

            _this.address = '92.63.111.134';
            _this.stat_server = 'https://nocoin.app/';
            const options = {
                key : _this.fs.readFileSync('ssl/2.txt'),
                cert: _this.fs.readFileSync('ssl/1.txt'),
                ca  : _this.fs.readFileSync('ssl/3.txt')
            };
            _this.http        = require('https').createServer(options,_this.app);
            _this.axios_http  = require('https');
        }

        
        _this.mongo_start();
        
        
        _this.http.listen(_this.port, _this.address,() => {
            
            _this.main_info.started_at = _this.get_timestamp();
            _this.main_info.ip_address = _this.address;
            _this.main_info.domain     = _this.address;
            _this.main_info.port       = _this.port;
            _this.main_info.used_nodes = 0;
            
            console.log('====================================');
            console.log('NoCoinMetaChainFullNode started on : https://' + _this.address + ' Port: ' + _this.port);
            console.log('====================================');
            
            
            _this.test();
        });

    },
    initializations: function(side_type = true){
        this.is_local = typeof side_type === 'boolean' ? side_type : true;
        this.start_fullnode();
    }
    
};

try{
    NoCoinMetaChainFullNode.initializations(true);
}
catch(ex)
{
    console.log('====================================');
    console.log('NoCoinMetaChainFullNode stoped! Reason: ' + ex.toString());
    console.log('====================================');
}
