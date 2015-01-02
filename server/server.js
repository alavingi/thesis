// Code partially based on the pattern given in Frank W. Zammetti's book

// Imports
var http = require("http");
var data_adapter = require("./data_adapter");
var oS = require("os");
var hostName = oS.hostname();


// Is incremented with each request
var requestId = 1;

// Preliminary processing
function initialProcessing(req, resp) {

  try {

    requestId = requestId + 1;

    // Wrapper object that is passed to various methods
    // request -  request object
    // response -  response object
    // data -  constructed from the body for insert and update requests
    // documentId -  mongodb document id
    var input = {
      requestIdentifier : new Date().getTime() + requestId, 
	  request : req, 
	  response : resp,
      data : null, 
	  documentId : null
    };

    console.log(input.requestIdentifier + ": " + req.method + " " + req.url);

    // Send back headers for an OPTIONS request
    if (req.method == "OPTIONS") {
      resp.writeHead(
        200, {
          "Content-Type" : "text/plain",
          "Access-Control-Allow-Origin" : "*",
          "Access-Control-Allow-Methods" : "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Max-Age" : "1000",
          "Access-Control-Allow-Headers" :
            "origin,x-csrftoken,content-type,accept"
        }
      );
      resp.end("");
      return;
    }

    // Parse the document Id from the request; not needed for POST since MongoDB will generate the Id for inserts
	// Select all and delete all requests will not have an associated document Id
	// The URL will be in the form of server/entityType/documentId 
    if (req.method != "POST") {
      input.documentId = req.url.substr(req.url.lastIndexOf("/") + 1);
    }

    // Do a regular expression match for a MongoDB Id which is a 24 digit hexadecimal number
	// If there is no match, let documentID for the request be null
	
    if (input.documentId != null) {
      input.documentId = input.documentId.match(/^[a-f0-9]{24}$/i);
    }

    

    // For POST or PUT requests, get the body content.
	// The client will send data as a JSON string which is then parsed into a JSON object
    if (req.method == "POST" || req.method == "PUT") {

      // This is done asynchronously.
      var content = "";
      req.on("data", function (inputData) {
        content += inputData;
      });

      
      req.on("end", function() {
		// Store the body content in the wrapper object as a JSON object before calling the next processing step
        input.data = JSON.parse(content);
        finalProcessing(input);
      });

    
    } 
    // GET and DELETE do not have body content, so call the next processing step
    else if (req.method == "GET" || req.method == "DELETE") {

      finalProcessing(input);
  	}
	
	// All other HTTP methods are not supported, so return a 405 code
	else {

      console.log(input.requestIdentifier + ": Unsupported method: " + req.method);
      sendResponse(
        input, 405, "text", "Unsupported method: " + req.method
      );

    }

  // The entire function is in a try block. If an exception occurs, it is sent back
  } catch (e) {
    console.log(input.requestIdentifier + ": Exception during initial processing) " + e);
    sendResponse(input, 500, "text", "Exception: " + e);
  }

} // End initialProcessing().


// The input wrapper object is now ready. This function calls the database adapter methods
function finalProcessing(input) {

  try {

    // Log input data Id.
    console.log(input.requestIdentifier + ": document Id: " + input.documentId);
    
    // The request URL will be in the form of server/entityType/documentId. If for some reason
	// the entity type is incorrect, return a 403 error
	
    var entityType = "";
    if (input.request.url.toLowerCase().indexOf("/account") != -1) {
      entityType = "account";
    } else if (input.request.url.toLowerCase().indexOf("/contact") != -1) {
      entityType = "contact";
    } else if (input.request.url.toLowerCase().indexOf("/opportunity") != -1) {
      entityType = "opportunity";
    } else if (input.request.url.toLowerCase().indexOf("/lead") != -1) {
      entityType = "lead";
    } else if (input.request.url.toLowerCase().indexOf("/meeting") != -1) {
      entityType = "meeting";
  	} else if (input.request.url.toLowerCase().indexOf("/call") != -1) {
      entityType = "call";
  	} else if (input.request.url.toLowerCase().indexOf("/clear") != -1) {
      entityType = "clear";  
    } else {
      console.log(input.requestIdentifier + ": Unsupported operation: " + input.request.url);
      sendResponse(
        input, 403, "text", "Unsupported operation: " + input.request.url
      );
      return;
    }

    // Call the data adapter methods
	
    if (entityType == "clear") {
      data_adapter.delete_all(input);
    } 
	else if (input.documentId == null && input.request.method == "GET") {
      data_adapter.select_all(entityType, input);
    } 
	else if (input.request.method == "GET") {
      data_adapter.select(entityType, input);
    }
	else if (input.request.method == "POST") {
      data_adapter.insert(entityType, input);
    }
	else if (input.request.method == "PUT") {
      data_adapter.update(entityType, input);
    }
	else if (input.request.method == "DELETE") {
      data_adapter.delete_one(entityType, input);
    }
	

  // Send the exception back in the response
  } catch (e) {
    console.log(input.requestIdentifier + ": Exception during final processing: " + e);
    sendResponse(input, 500, "text", "Exception: " + e);
  }

} 


// This function sends the response back to the client
// input     The input object created in initialProcessing()
// statusCode  HTTP status code to set
// contentType Content type is either 'text' or 'json'
// body     The content to return
 
sendResponse = function(input, statusCode, contentType, body) {

  // Access-Control-Allow-Origin header is needed to allow
  // cross-domain requestuests.
  var ctype = "";
  if (contentType == "json") {
    ct = "application/json";
  }
  else {
	  ctype = "text/plain"
  }
  input.response.writeHead(
    statusCode, { "Content-Type" : ctype, "Access-Control-Allow-Origin" : "*" }
  );
  input.response.end(body);

} 



// Now define and start the Node.js server.
var server = http.createServer(initialProcessing);
server.listen("9999", hostName);
console.log("\nServer started at http://ec2-54-68-187-203.us-west-2.compute.amazonaws.com:9999\n");
