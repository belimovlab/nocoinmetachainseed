let NoCoinMetaCain = {
    is_local : true,
    port     : 44400,
    
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
    startseedserver : function(){
        let _this = this;
        console.log('====================================');
        console.log('NoCoinMetaChain started ...');
        console.log('====================================');
        
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
        
        if(_this.is_local === true)
        {
            //======================================================================
            //                      LOCAL
            //======================================================================
            
            _this.address  = 'localhost';
            _this.stat_server = 'https://localhost/';
            _this.stat_php = 'php';
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
            _this.stat_php = '/opt/php72/bin/php';
            const options = {
                key : _this.fs.readFileSync('ssl/2.txt'),
                cert: _this.fs.readFileSync('ssl/1.txt'),
                ca  : _this.fs.readFileSync('ssl/3.txt')
            };
            _this.http        = require('https').createServer(options,_this.app);
            _this.axios_http  = require('https');
        }

        _this.io = require('socket.io')(_this.http, {
            cors: {
                origin: "*",
            }
        });
        _this.http.listen(_this.port, _this.address,() => {
            
            _this.main_info.started_at = _this.get_timestamp();
            _this.main_info.ip_address = _this.address;
            _this.main_info.domain     = _this.address;
            _this.main_info.port       = _this.port;
            _this.main_info.used_nodes = 0;
            
            
            
            console.log('NoCoin.App server started on : https://' + _this.address + ' Port: ' + _this.port);
            _this.initialization_socket();
            _this.initialization_routing();
        });

    },
    initialization_routing : function(){
        let _this = this;
        _this.app.get('/', (req, res) => {
            try{
                _this.fs.readFile('templates/index.html',function (err, data){
                    res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
                    res.write(data);
                    res.end();
                });
            }
            catch(ex)
            {
                res.jsonp({
                    status  : 'error',
                    message : 'Ошибка идентификатора пользователя!'
                });
            }
        });
        _this.app.get('/rpc/', (req, res) => {
            try{
                
                let sss = 'check_main';
                _this.fs.readFile('templates/index.html',function (err, data){
                    res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
                    res.write(data);
                    res.end();
                });
            }
            catch(ex)
            {
                res.jsonp({
                    status  : 'error',
                    message : 'Unknown method!'
                });
            }
        });
        _this.app.post('/rpc/', (req, res) => {
            
            let data = req.body;
            
            if(!data.hasOwnProperty('jsonrpc'))
            {
                return _this.send_error(res, {
                    error_code : 1001,
                    message    : 'Unknown RPC format',
                });
            }
            
            if(!data.hasOwnProperty('method') || data.method.lengh < 0)
            {
                return _this.send_error(res, {
                    error_code : 1002,
                    message    : 'Unknown RPC method',
                });
            }
            
            if(_this.allowed_methods.indexOf(data.method.toLowerCase()) === -1)
            {
                return _this.send_error(res, {
                    error_code : 1002,
                    message    : 'RPC method not allowed!',
                });
            }
            
            if(!data.hasOwnProperty('id') || data.id.lengh < 0)
            {
                return _this.send_error(res, {
                    error_code : 1008,
                    message    : 'Unknown RPC request ID',
                });
            }
            
            try{
                _this[data.method](res, data, data.id);
 
            }catch(ex)
            {
                return _this.send_error(res,{
                    error_code : 1007,
                    message    : ex.toString()
                });
            }
        });
    },
    initialization_socket  : function(){
        let _this = this;
        _this.io.on('connection', (socket) => {
            
            _this.nodeList[socket.id] = {
                nodeName : '',
                nodeHash : '',
                nodeIp   : '',
                nodeNet  : ''
            };
            
            
            socket.on('user_intial',(data) => {
                socket.join('room_'+data.user_id);
                
                console.log('Инициализация сокета...');
                
                if(data.user_type === 1)
                {
                    socket.join('admins');
                }
                _this.io.to('room_'+data.user_id).emit('hello',{
                    message : 'Welcome to Nocoinmeta.com'
                });
            });
        });   
    },
    initializations: function(side_type = true){
        this.is_local = typeof side_type === 'boolean' ? side_type : true;
        this.startseedserver();
    }
};

try{
    NoCoinMetaCain.initializations(true);
}
catch(ex)
{
    console.log('====================================');
    console.log('NoCoinMetaChain stoped! Reason: ' + ex.toString());
    console.log('====================================');
}
