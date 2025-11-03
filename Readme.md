node-red-contrib-servicenow-oauth-table-api
========================

A [Node-RED](https://www.nodered.org/) node collection to interact with ServiceNow Table API using OAuth 2.0 authentication. [Table API doc](https://developer.servicenow.com/dev.do#!/reference/api/quebec/rest/c_TableAPI).

Install
-------

### Option 1: Using Node-RED Palette Manager (Recommended)

1. Open your Node-RED editor
2. Click on the menu (top right) → Manage palette
3. Go to the "Install" tab
4. Search for `node-red-contrib-servicenow-oauth-table-api`
5. Click "Install"

### Option 2: Using npm

Run command on Node-RED installation directory:

	npm install node-red-contrib-servicenow-oauth-table-api

or run command for global installation:

	npm install -g node-red-contrib-servicenow-oauth-table-api

After installation, restart Node-RED to load the new nodes.

Nodes
-----

* Retrieve Records: Retrieves multiple records for the specified table (GET)
* Retrieve Record: Retrieves the record identified by the specified sys_id from the specified table (GET)
* Modify Record: Updates the specified record with the request body. (PUT)
* Update Record: Updates the specified record with the name-value pairs included in the request body (PATCH)
* Create Record: Inserts one record in the specified table. Multiple record insertion is not supported by this method (POST)
* Delete Record: Deletes the specified record from the specified table. (DELETE)

Config Nodes
-----

### servicenow-config

Configuration node for OAuth 2.0 authentication with ServiceNow.

**Required Parameters:**

* **Name**: A descriptive name for this configuration
* **Instance**: Your ServiceNow instance URL (e.g., `https://yourinstance.service-now.com`)
* **Client ID**: OAuth client identifier from your ServiceNow OAuth application
* **Client Secret**: OAuth client secret from your ServiceNow OAuth application
* **Scope**: OAuth scope defining which ServiceNow tables/resources the token can access (e.g., `incident`, `useraccount`)

**Important Notes:**

* **Scope vs Topic**: The `scope` parameter (configured here) defines OAuth permissions for the token. The `msg.topic` parameter (set in each flow message) specifies which table to operate on. They are different concepts:
  - Scope = "What can my token access?" (OAuth permission)
  - Topic = "Which table am I working with right now?" (API endpoint)
* A new OAuth token is automatically obtained for each API request
* Make sure the scope includes all tables you plan to access in your flows

Authentication
--------------

This package uses **OAuth 2.0** with the `client_credentials` grant type for authentication.

### How it works:

1. Configure the `servicenow-config` node with your OAuth credentials (client_id, client_secret, scope)
2. When a message flows through any operation node (retrieve, create, modify, etc.):
   - The node automatically requests an OAuth access token from ServiceNow (`POST /oauth_token.do`)
   - ServiceNow responds with an access token valid for ~30 minutes
   - The operation is executed using the Bearer token in the Authorization header
3. Each API operation automatically handles token acquisition - no manual token management required

### OAuth Flow Details:

**Token Request:**
```
POST https://yourinstance.service-now.com/oauth_token.do
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=YOUR_SCOPE
```

**Token Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 1799,
  "scope": "incident"
}
```

**API Request:**
```
GET https://yourinstance.service-now.com/api/now/table/incident
Authorization: Bearer ACCESS_TOKEN
```

Message parameters
------------------

### Retrieve Records Properties

| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_parm_query                     | Optional Query Parameters (default '')    |
| msg.sysparm_display_value              | Optional Query Parameters (default false) |
| msg.sysparm_exclude_reference_link     | Optional Query Parameters (default false) |
| msg.sysparm_suppress_pagination_header | Optional Query Parameters (default false) |
| msg.sysparm_fields                     | Optional Query Parameters (default 10)    |
| msg.sysparm_limit                      | Optional Query Parameters (default '')    |
| msg.sysparm_view                       | Optional Query Parameters (default '')    |
| msg.sysparm_query_category             | Optional Query Parameters (default '')    |
| msg.sysparm_query_no_domain            | Optional Query Parameters (default false) |
| msg.sysparm_no_count                   | Optional Query Parameters (default false) |

### Retrieve Record Properties

| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_id                             | mandatory sys_id identifier               |
| msg.sysparm_display_value              | Optional Query Parameters (default false) |
| msg.sysparm_exclude_reference_link     | Optional Query Parameters (default false) |
| msg.sysparm_fields                     | Optional Query Parameters (default 10)    |
| msg.sysparm_view                       | Optional Query Parameters (default '')    |
| msg.sysparm_query_no_domain            | Optional Query Parameters (default false) |

### Modify Record Properties

| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_id                             | mandatory sys_id identifier               |
| msg.sysparm_display_value              | Optional Query Parameters (default false) |
| msg.sysparm_exclude_reference_link     | Optional Query Parameters (default false) |
| msg.sysparm_fields                     | Optional Query Parameters (default 10)    |
| msg.sysparm_view                       | Optional Query Parameters (default '')    |
| msg.sysparm_input_display_value        | Optional Query Parameters (default false) |
| msg.sysparm_suppress_auto_sys_field    | Optional Query Parameters (default false) |
| msg.sysparm_query_no_domain            | Optional Query Parameters (default false) |

### Update Record

| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_id                             | mandatory sys_id identifier               |
| msg.sysparm_display_value              | Optional Query Parameters (default false) |
| msg.sysparm_exclude_reference_link     | Optional Query Parameters (default false) |
| msg.sysparm_fields                     | Optional Query Parameters (default 10)    |
| msg.sysparm_view                       | Optional Query Parameters (default '')    |
| msg.sysparm_input_display_value        | Optional Query Parameters (default false) |
| msg.sysparm_suppress_auto_sys_field    | Optional Query Parameters (default false) |
| msg.sysparm_query_no_domain            | Optional Query Parameters (default false) |

### Create Record

| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_id                             | mandatory sys_id identifier               |
| msg.sysparm_display_value              | Optional Query Parameters (default false) |
| msg.sysparm_exclude_reference_link     | Optional Query Parameters (default false) |
| msg.sysparm_fields                     | Optional Query Parameters (default 10)    |
| msg.sysparm_input_display_value        | Optional Query Parameters (default false) |
| msg.sysparm_suppress_auto_sys_field    | Optional Query Parameters (default false) |
| msg.sysparm_view                       | Optional Query Parameters (default '')    |

### Delete Record


| __**Property**__                       | __**Use**__                               |
|----------------------------------------|-------------------------------------------|
| msg.topic                              | mandatory tableName                       |
| msg.sys_id                             | mandatory sys_id identifier               |
| msg.sysparm_query_no_domain            | Optional Query Parameters (default false) |

Flow Example
---
Copy and import in your node-red

```
[{"id":"421fdc9c.1f8134","type":"tab","label":"Flow 1","disabled":false,"info":""},{"id":"b3866e5.796909","type":"debug","z":"421fdc9c.1f8134","name":"Show response","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":580,"y":260,"wires":[]},{"id":"19cab4c4.6cc5f3","type":"modify record","z":"421fdc9c.1f8134","name":"","server":"","x":340,"y":420,"wires":[["b3866e5.796909"]]},{"id":"7dc62c36.8083ac","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sys_id","v":"b8736e31871030107aa7cbb9cebb354e","vt":"str"},{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","payload":"{\"short_description\":\"Modify Record Node\"}","payloadType":"json","x":150,"y":420,"wires":[["19cab4c4.6cc5f3"]]},{"id":"1fc4e6ea.8ab849","type":"delete record","z":"421fdc9c.1f8134","name":"","server":"","x":330,"y":500,"wires":[["b3866e5.796909"]]},{"id":"1180f57d.8defb3","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sys_id","v":"e0650148871070107aa7cbb9cebb35cb","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","x":150,"y":500,"wires":[["1fc4e6ea.8ab849"]]},{"id":"c3f5775a.df0978","type":"patch record","z":"421fdc9c.1f8134","name":"","server":"","x":330,"y":460,"wires":[["b3866e5.796909"]]},{"id":"6a58d6f5.b710a8","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sys_id","v":"e0650148871070107aa7cbb9cebb35cb","vt":"str"},{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","payload":"{\"short_description\":\"patch Record Node\"}","payloadType":"json","x":150,"y":460,"wires":[["c3f5775a.df0978"]]},{"id":"fb46a6ec.4b376","type":"retrieve records","z":"421fdc9c.1f8134","name":"","server":"","x":340,"y":260,"wires":[["b3866e5.796909"]]},{"id":"bd788f44.140e9","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sysparm_query","v":"","vt":"str"},{"p":"sysparm_limit","v":"10","vt":"str"},{"p":"display_value","v":"false","vt":"jsonata"},{"p":"msg.sysparm_exclude_reference_link","v":"false","vt":"jsonata"},{"p":"sysparm_fields","v":"","vt":"str"},{"p":"sysparm_view","v":"view","vt":"str"},{"p":"sysparm_query_category","v":"category","vt":"str"},{"p":"sysparm_query_no_domain","v":"false","vt":"jsonata"},{"p":"sysparm_no_count","v":"false","vt":"jsonata"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","payloadType":"str","x":140,"y":260,"wires":[["fb46a6ec.4b376"]]},{"id":"66469ea0.544bc8","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sysparm_limit","v":"40","vt":"num"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","payloadType":"str","x":140,"y":300,"wires":[["fb46a6ec.4b376"]]},{"id":"fb91ffdc.266a9","type":"comment","z":"421fdc9c.1f8134","name":"Nodes for ServiceNow Table API","info":"","x":190,"y":220,"wires":[]},{"id":"1221d549.6b2b63","type":"retrieve record","z":"421fdc9c.1f8134","name":"","server":"","x":340,"y":340,"wires":[["b3866e5.796909"]]},{"id":"7c99af4c.a240c8","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"sys_id","v":"4c806e31871030107aa7cbb9cebb35dd","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","x":150,"y":340,"wires":[["1221d549.6b2b63"]]},{"id":"fdbcd7c1.5f5af8","type":"create record","z":"421fdc9c.1f8134","name":"","server":"","x":330,"y":380,"wires":[["b3866e5.796909"]]},{"id":"574b92d4.99624c","type":"inject","z":"421fdc9c.1f8134","name":"Set","props":[{"p":"topic","vt":"str"},{"p":"payload"},{"p":"display_value","v":"true","vt":"jsonata"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"incident","payload":"{\"short_description\":\"Create Record Node\"}","payloadType":"json","x":150,"y":380,"wires":[["fdbcd7c1.5f5af8"]]},{"id":"56253416.c9be7c","type":"create record","z":"421fdc9c.1f8134","name":"","server":"","x":680,"y":660,"wires":[[]]}]´´
´´´
