module.exports = function(RED) {

// Configuration Node ServiceNowNode

    function ServiceNowNode(n) {
        RED.nodes.createNode(this,n);
        var axios = require("axios");
        var node = this;
        this.instance= n.instance;
        this.client_id= n.client_id;
        this.client_secret= n.client_secret;
        this.scope= n.scope;

        this.obtainToken = function(callback) {
            // Normalize instance URL - remove trailing slash
            var instanceUrl = node.instance.replace(/\/$/, '');

            // Prepare OAuth token request data
            var tokenData = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: node.client_id,
                client_secret: node.client_secret,
                scope: node.scope
            }).toString();

            axios.post(instanceUrl + '/oauth_token.do', tokenData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(function(response) {
                callback(null, response.data.access_token);
            })
            .catch(function(error) {
                var errorMsg = 'OAuth token request failed';
                if (error.response) {
                    errorMsg += ' with status ' + error.response.status + ': ' + JSON.stringify(error.response.data);
                } else {
                    errorMsg += ': ' + error.message;
                }
                callback(new Error(errorMsg));
            });
        };

        this.doRequest = function(options, callback) {
            node.obtainToken(function(err, accessToken) {
                if (err) {
                    return callback(err);
                }

                // Normalize instance URL - remove trailing slash
                var instanceUrl = node.instance.replace(/\/$/, '');

                // Convert baseUrl + uri to single url if using baseUrl
                var url;
                if (options.baseUrl && options.uri) {
                    url = instanceUrl + '/' + options.uri.replace(/^\//, '');
                } else if (options.url) {
                    url = options.url;
                } else if (options.uri) {
                    url = instanceUrl + '/' + options.uri.replace(/^\//, '');
                }

                // Prepare axios config
                var axiosConfig = {
                    method: options.method || 'GET',
                    url: url,
                    headers: options.headers || {},
                    data: options.body
                };

                // Support for binary responses (e.g., file downloads)
                if (options.responseType) {
                    axiosConfig.responseType = options.responseType;
                }

                // Add Bearer token
                axiosConfig.headers['Authorization'] = 'Bearer ' + accessToken;

                // Make the request
                axios(axiosConfig)
                .then(function(response) {
                    // Adapt axios response to match request library format for compatibility
                    var adaptedResponse = {
                        statusCode: response.status,
                        headers: response.headers,
                        body: response.data
                    };
                    callback(null, adaptedResponse, response.data);
                })
                .catch(function(error) {
                    if (error.response) {
                        // Server responded with error status
                        var adaptedResponse = {
                            statusCode: error.response.status,
                            headers: error.response.headers,
                            body: error.response.data
                        };
                        callback(null, adaptedResponse, error.response.data);
                    } else {
                        // Network error or other issue
                        callback(error);
                    }
                });
            });
        };
    }

// Node Retrieve Records

    
    function RetrieveRecords(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Initial sysparm with defaults values
        var sysparm = {
            query: '' ,
            display_value: false ,
            exclude_reference_link: false,
            suppress_pagination_header: false,
            fields: '',
            limit: 10,
            view: '',
            query_category: '',
            query_no_domain: false,
            no_count: false
        };

        this.prepareRequest = function(table,sysparm,callback) {
            var options = {
                baseUrl: server.instance,
                //uri: 'api/now/table/'+table+'?sysparm_query='+sysparm.query+'sysparm_fields='+sysparm.fields+'&sysparm_limit='+sysparm.limit,
                uri: 'api/now/table/'+table+
                        '?sysparm_query='+sysparm.query+
                        '&sysparm_display_value='+sysparm.display_value+
                        '&sysparm_exclude_reference_link='+sysparm.exclude_reference_link+
                        '&sysparm_suppress_pagination_header='+sysparm.suppress_pagination_header+
                        '&sysparm_fields='+sysparm.fields+
                        '&sysparm_limit='+sysparm.limit+
                        '&sysparm_view='+sysparm.view+
                        '&sysparm_query_category='+sysparm.query_category+
                        '&sysparm_query_no_domain='+sysparm.query_no_domain+
                        '&sysparm_sysparm_no_count='+sysparm.sysparm_no_count,
                body: null,
                method: 'GET',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };
                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;

            // Replace sysparm with node properties
            if (msg.sysparm_query){
                sysparm.query=msg.sysparm_query
            }
            if (msg.sysparm_display_value){
                sysparm.display_value=msg.sysparm_display_value
            }
            if (msg.sysparm_exclude_reference_link){
                sysparm.exclude_reference_link=msg.sysparm_exclude_reference_link
            }
            if (msg.sysparm_suppress_pagination_header){
                sysparm.suppress_pagination_header=msg.sysparm_suppress_pagination_header
            }
            if (msg.sysparm_fields){
                sysparm.fields=msg.sysparm_fields
            }
            if (msg.sysparm_limit){
                sysparm.limit=msg.sysparm_limit
            }
            if (msg.sysparm_view){
                sysparm.view=msg.sysparm_view
            }
            if (msg.sysparm_query_category){
                sysparm.query_category=msg.sysparm_query_category
            }
            if (msg.sysparm_query_no_domain){
                sysparm.query_no_domain=msg.sysparm_query_no_domain
            }
            if (msg.sysparm_no_count){
                sysparm.no_count=msg.sysparm_no_count
            }

            if (!table) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 200) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error Retrieving records (" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,callback);
        });
    
    }


// Node Retrieve a Record


    function RetrieveRecord(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Initial sysparm with defaults values
        var sysparm = {
            sys_id: '' ,
            display_value: false ,
            exclude_reference_link: false,
            fields: '',
            view: '',
            query_no_domain: false
        };

        this.prepareRequest = function(table,sysparm,callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/table/'+table+
                        '/'+sysparm.sys_id+
                        '?sysparm_display_value='+sysparm.display_value+
                        '&sysparm_exclude_reference_link='+sysparm.exclude_reference_link+
                        '&sysparm_fields='+sysparm.fields+
                        '&sysparm_view='+sysparm.view+
                        '&sysparm_query_no_domain='+sysparm.query_no_domain,
                body: null,
                method: 'GET',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };
                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;

            // Replace sysparm with node properties
            if (msg.sys_id){
                sysparm.sys_id=msg.sys_id
            }
            if (msg.sysparm_display_value){
                sysparm.display_value=msg.sysparm_display_value
            }
            if (msg.sysparm_exclude_reference_link){
                sysparm.exclude_reference_link=msg.sysparm_exclude_reference_link
            }
            if (msg.sysparm_fields){
                sysparm.fields=msg.sysparm_fields
            }
            if (msg.sysparm_view){
                sysparm.view=msg.sysparm_view
            }
            if (msg.sysparm_query_no_domain){
                sysparm.query_no_domain=msg.sysparm_query_no_domain
            }

            if (!table || !sysparm.sys_id) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 200) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error Retrieving record: "+ sysparm.sys_id + "(" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,callback);
        });
    
    }

// Node Modify a Record


    function ModifyRecord(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Initial sysparm with defaults values
        var sysparm = {
            sys_id: '' ,
            display_value: false ,
            exclude_reference_link: false,
            fields: '',
            input_display_value: false,
            suppress_auto_sys_field: false,
            view: '',
            query_no_domain: false
        };

        this.prepareRequest = function(table,sysparm,requestBody,callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/table/'+table+'/'+sysparm.sys_id,
                body: requestBody,
                method: 'PUT',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };
                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;
            var requestBody = msg.payload;

            // Replace sysparm with node properties
            if (msg.sys_id){
                sysparm.sys_id=msg.sys_id
            }
            if (msg.sysparm_display_value){
                sysparm.display_value=msg.sysparm_display_value
            }
            if (msg.sysparm_exclude_reference_link){
                sysparm.exclude_reference_link=msg.sysparm_exclude_reference_link
            }
            if (msg.sysparm_fields){
                sysparm.fields=msg.sysparm_fields
            }
            if (msg.sysparm_input_display_value){
                sysparm.input_display_value=msg.sysparm_input_display_value
            }
            if (msg.sysparm_suppress_auto_sys_field){
                sysparm.suppress_auto_sys_field=msg.sysparm_suppress_auto_sys_field
            }
            if (msg.sysparm_view){
                sysparm.view=msg.sysparm_view
            }
            if (msg.sysparm_query_no_domain){
                sysparm.query_no_domain=msg.sysparm_query_no_domain
            }

            if (!table || !sysparm.sys_id || !requestBody) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 200) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error Retrieving record: "+ sysparm.sys_id + "(" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,requestBody,callback);
        });
    
    }

// Node Patch a Record


    function PatchRecord(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Initial sysparm with defaults values
        var sysparm = {
            sys_id: '' ,
            display_value: false ,
            exclude_reference_link: false,
            fields: '',
            input_display_value: false,
            suppress_auto_sys_field: false,
            view: '',
            query_no_domain: false
        };


        this.prepareRequest = function(table,sysparm,requestBody,callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/table/'+table+'/'+sysparm.sys_id,
                body: requestBody,
                method: 'PUT',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };
                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;
            var requestBody = msg.payload;

            // Replace sysparm with node properties
            if (msg.sys_id){
                sysparm.sys_id=msg.sys_id
            }
            if (msg.sysparm_display_value){
                sysparm.display_value=msg.sysparm_display_value
            }
            if (msg.sysparm_exclude_reference_link){
                sysparm.exclude_reference_link=msg.sysparm_exclude_reference_link
            }
            if (msg.sysparm_fields){
                sysparm.fields=msg.sysparm_fields
            }
            if (msg.sysparm_input_display_value){
                sysparm.input_display_value=msg.sysparm_input_display_value
            }
            if (msg.sysparm_suppress_auto_sys_field){
                sysparm.suppress_auto_sys_field=msg.sysparm_suppress_auto_sys_field
            }
            if (msg.sysparm_view){
                sysparm.view=msg.sysparm_view
            }
            if (msg.sysparm_query_no_domain){
                sysparm.query_no_domain=msg.sysparm_query_no_domain
            }

            if (!table || !sysparm.sys_id || !requestBody) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 200) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error Patching record: "+ sysparm.sys_id + "(" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,requestBody,callback);
        });
    
    }

// Node Delete a Record


    function DeleteRecord(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);


        // Initial sysparm with defaults values
        var sysparm = {
            sys_id: '' ,
            query_no_domain: false
        };


        this.prepareRequest = function(table,sysparm,callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/table/'+table+'/'+sysparm.sys_id,
                body: null,
                method: 'DELETE',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };
                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;
            

            // Replace sysparm with node properties
            if (msg.sys_id){
                sysparm.sys_id=msg.sys_id
            }
            if (msg.sysparm_query_no_domain){
                sysparm.query_no_domain=msg.sysparm_query_no_domain
            }

            if (!table || !sysparm.sys_id) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 204) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error Deleting record: "+ sysparm.sys_id + "(" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,callback);
        });
    
    }



// Node Create Record

    function CreateRecord(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Initial sysparm with defaults values
        var sysparm = {
            display_value: false ,
            exclude_reference_link: false,
            fields: '',
            input_display_value: false,
            suppress_auto_sys_field: false,
            view: ''
        };

        this.prepareRequest = function(table,sysparm,requestBody,callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/table/'+table,
                body: requestBody,
                method: 'POST',
                json: true,
                headers: {
                 'Content-Type': 'application/json'
                }
            };

                server.doRequest(options, callback);

        }

        this.on('input', function(msg) {
            var table = msg.topic;
            var requestBody = msg.payload;

            // Replace sysparm with node properties

            if (msg.sysparm_display_value){
                sysparm.display_value=msg.sysparm_display_value
            }
            if (msg.sysparm_exclude_reference_link){
                sysparm.exclude_reference_link=msg.sysparm_exclude_reference_link
            }
            if (msg.sysparm_fields){
                sysparm.fields=msg.sysparm_fields
            }
            if (msg.sysparm_input_display_value){
                sysparm.input_display_value=msg.sysparm_input_display_value
            }
            if (msg.sysparm_suppress_auto_sys_field){
                sysparm.suppress_auto_sys_field=msg.sysparm_suppress_auto_sys_field
            }
            if (msg.sysparm_view){
                sysparm.view=msg.sysparm_view
            }

            if (!table || !requestBody) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message received"
                });
            }
            var callback = function(err, res, body) {


                if (res.statusCode === 201) {
                    node.status({});
                    msg.payload=res;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Create failed"
                    });
                    node.error("Error Create Record (" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }

            };
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });
            this.prepareRequest(table,sysparm,requestBody,callback);
        });
    
    }

// Node Get Attachment Metadata

    function GetAttachmentMetadata(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        // Single attachment metadata retrieval
        this.prepareRequestSingle = function(attachmentSysId, callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/attachment/' + attachmentSysId,
                body: null,
                method: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            server.doRequest(options, callback);
        };

        // Multiple attachments metadata retrieval (query-based)
        this.prepareRequestQuery = function(sysparmQuery, sysparmLimit, sysparmOffset, callback) {
            var uri = 'api/now/attachment';
            var queryParams = [];

            if (sysparmQuery) {
                queryParams.push('sysparm_query=' + encodeURIComponent(sysparmQuery));
            }
            if (sysparmLimit) {
                queryParams.push('sysparm_limit=' + encodeURIComponent(sysparmLimit));
            }
            if (sysparmOffset) {
                queryParams.push('sysparm_offset=' + encodeURIComponent(sysparmOffset));
            }

            if (queryParams.length > 0) {
                uri += '?' + queryParams.join('&');
            }

            var options = {
                baseUrl: server.instance,
                uri: uri,
                body: null,
                method: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            server.doRequest(options, callback);
        };

        this.on('input', function(msg) {
            var attachmentSysId = msg.sys_id;
            var sysparmQuery = msg.sysparm_query;
            var sysparmLimit = msg.sysparm_limit;
            var sysparmOffset = msg.sysparm_offset;

            // Determine mode: single or query-based
            var isSingleMode = attachmentSysId && !sysparmQuery;
            var isQueryMode = sysparmQuery;

            if (!isSingleMode && !isQueryMode) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message: sys_id or sysparm_query required"
                });
                return;
            }

            var callback = function(err, res, body) {
                if (res.statusCode === 200) {
                    node.status({});
                    msg.payload = res.body.result;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    var errorContext = isSingleMode ? attachmentSysId : sysparmQuery;
                    node.error("Error getting attachment metadata: " + errorContext + " (" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }
            };

            node.status({
                fill: "blue",
                shape: "dot",
                text: "Requesting..."
            });

            if (isSingleMode) {
                this.prepareRequestSingle(attachmentSysId, callback);
            } else {
                this.prepareRequestQuery(sysparmQuery, sysparmLimit, sysparmOffset, callback);
            }
        });
    }

// Node Delete Attachment

    function DeleteAttachment(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        this.prepareRequest = function(attachmentSysId, callback) {
            var options = {
                baseUrl: server.instance,
                uri: 'api/now/attachment/' + attachmentSysId,
                body: null,
                method: 'DELETE',
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            server.doRequest(options, callback);
        };

        this.on('input', function(msg) {
            var attachmentSysId = msg.sys_id || msg.topic;

            if (!attachmentSysId) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message: sys_id required"
                });
                return;
            }

            var callback = function(err, res, body) {
                if (res.statusCode === 204) {
                    node.status({});
                    msg.payload = {};
                    msg.statusCode = 204;
                    node.send(msg);
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Request failed"
                    });
                    node.error("Error deleting attachment: " + attachmentSysId + " (" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }
            };

            node.status({
                fill: "blue",
                shape: "dot",
                text: "Deleting..."
            });
            this.prepareRequest(attachmentSysId, callback);
        });
    }

// Node Upload Attachment

    function UploadAttachment(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        this.prepareRequest = function(tableName, recordSysId, filename, fileBuffer, contentType, encryptionContext, creationTime, callback) {
            var instanceUrl = server.instance.replace(/\/$/, '');
            var url = instanceUrl + '/api/now/attachment/file' +
                      '?table_name=' + encodeURIComponent(tableName) +
                      '&table_sys_id=' + encodeURIComponent(recordSysId) +
                      '&file_name=' + encodeURIComponent(filename);

            // Add optional encryption_context parameter
            if (encryptionContext) {
                url += '&encryption_context=' + encodeURIComponent(encryptionContext);
            }

            // Add optional creation_time parameter
            if (creationTime) {
                url += '&creation_time=' + encodeURIComponent(creationTime);
            }

            var options = {
                url: url,
                body: fileBuffer,
                method: 'POST',
                json: false,
                headers: {
                    'Content-Type': contentType || 'application/octet-stream',
                    'Accept': 'application/json'
                }
            };
            server.doRequest(options, callback);
        };

        this.on('input', function(msg) {
            var tableName = msg.topic;
            var recordSysId = msg.sys_id;
            var filename = msg.filename;
            var fileBuffer = msg.payload;
            var contentType = msg.contentType;
            var encryptionContext = msg.encryption_context;
            var creationTime = msg.creation_time;

            if (!tableName || !recordSysId || !filename || !fileBuffer) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message: topic, sys_id, filename, payload required"
                });
                return;
            }

            if (!Buffer.isBuffer(fileBuffer)) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid payload: must be Buffer"
                });
                return;
            }

            var callback = function(err, res, body) {
                if (res.statusCode === 201) {
                    node.status({});
                    try {
                        var result = typeof body === 'string' ? JSON.parse(body) : body;
                        msg.payload = result.result || result;
                        node.send(msg);
                    } catch (parseError) {
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "Parse error"
                        });
                        node.error("Error parsing response: " + parseError);
                    }
                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Upload failed"
                    });
                    node.error("Error uploading attachment (" + res.statusCode + "): " + JSON.stringify(err) + " " + JSON.stringify(body));
                }
            };

            node.status({
                fill: "blue",
                shape: "dot",
                text: "Uploading..."
            });
            this.prepareRequest(tableName, recordSysId, filename, fileBuffer, contentType, encryptionContext, creationTime, callback);
        });
    }

// Node Download Attachment

    function DownloadAttachment(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var server = RED.nodes.getNode(config.server);

        this.on('input', function(msg) {
            var attachmentSysId = msg.sys_id || msg.topic;

            if (!attachmentSysId) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Invalid message: sys_id required"
                });
                return;
            }

            node.status({
                fill: "blue",
                shape: "dot",
                text: "Getting metadata..."
            });

            // Step 1: Get metadata
            var metadataOptions = {
                baseUrl: server.instance,
                uri: 'api/now/attachment/' + attachmentSysId,
                method: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            server.doRequest(metadataOptions, function(err, metaRes, metaBody) {
                if (metaRes.statusCode !== 200) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Metadata request failed"
                    });
                    node.error("Error getting attachment metadata: " + attachmentSysId + " (" + metaRes.statusCode + ")");
                    return;
                }

                var metadata = metaRes.body.result;
                msg.filename = metadata.file_name;
                msg.contentType = metadata.content_type;

                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "Downloading file..."
                });

                // Step 2: Download file
                var downloadOptions = {
                    baseUrl: server.instance,
                    uri: 'api/now/attachment/' + attachmentSysId + '/file',
                    method: 'GET',
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': '*/*'
                    }
                };

                server.doRequest(downloadOptions, function(err, fileRes, fileBody) {
                    if (fileRes.statusCode === 200) {
                        node.status({});
                        msg.payload = Buffer.from(fileRes.body);
                        node.send(msg);
                    } else {
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "Download failed"
                        });
                        node.error("Error downloading attachment: " + attachmentSysId + " (" + fileRes.statusCode + ")");
                    }
                });
            });
        });
    }

    RED.nodes.registerType("patch record",PatchRecord);
    RED.nodes.registerType("modify record",ModifyRecord);
    RED.nodes.registerType("delete record",DeleteRecord);
    RED.nodes.registerType("create record",CreateRecord);
    RED.nodes.registerType("retrieve records",RetrieveRecords);
    RED.nodes.registerType("retrieve record",RetrieveRecord);
    RED.nodes.registerType("get attachment metadata",GetAttachmentMetadata);
    RED.nodes.registerType("delete attachment",DeleteAttachment);
    RED.nodes.registerType("upload attachment",UploadAttachment);
    RED.nodes.registerType("download attachment",DownloadAttachment);
    RED.nodes.registerType("servicenow-config",ServiceNowNode);
}