// Code partially based on the pattern given in Frank W. Zammetti's book

// Import mongoose
var mongoose = require("mongoose");

// Mongoose schemas for all entities.
var schemas = {
  account : mongoose.Schema({
    account_name : "string", 
	phone : "string", 
	fax : "string",
    email : "string", 
	url : "string", 
	street : "string", 
	city : "string"
	state : "string", 
	zip : "string", 
	country : "string",
    revenue : "number", 
	employees : "number",
    description : "string"
  }),
  contact : mongoose.Schema({
    first_name : "string", 
	last_name : "string",
	title : "string", 
	birth_date : "date", 
	account_id : "number", 
	department : "string", 
	phone : "string",
	email : "string", 
	street : "string", 
	city : "string"
	state : "string", 
	zip : "string", 
	country : "string"
  }),
  opportunity : mongoose.Schema({
	opportunity_name : "string",
	account_id : "number", 
	assigned_to : "string",
	amount : "number", 
	sales_stage : "string",
	probability : "number"
  }),
  lead : mongoose.Schema({
    company : "string", 
	first_name : "string", 
	last_name : "string",
    lead_status : "string", 
	industry : "string",
	revenue : "number", 
	employees : "number"
  }),
  meeting : mongoose.Schema({
	subject : "string", 
	start_date : "date", 
	end_date : "date", 
	duration : "number",
    description : "string", 
	meeting_status : "string", 
	related_to : "string"
  }),
  call : mongoose.Schema({
	subject : "string", 
	call_date : "date", 
	call_time : "date", 
	duration : "number", 
    description : "string", 
	call_status : "string", 
	related_to : "string"
  })
};


// Mongoose models for all entities.
var models = {
  account : mongoose.model("account", schemas.account),
  contact : mongoose.model("contact", schemas.contact),
  opportunty : mongoose.model("opportunty", schemas.opportunty),
  lead : mongoose.model("lead", schemas.lead),
  meeting : mongoose.model("meeting", schemas.meeting),
  call : mongoose.model("call", schemas.call)
}


// Connect to database at the default port.
mongoose.connect("localhost", "ContactManager");



// Insert a document
// entityType - eg account, contact etc.
// input - wrapper object
function insert(entityType, input) {

  console.log(input.requestIdentifier + ": data_adapter.insert() : " + entityType);

  var model = new models[entityType](input.data);
  console.log(input.requestIdentifier + ": obj: " + JSON.stringify(obj));
  model.save(function (error, returnData) {
    if (error) {
	  // exception will be caught in the server	
      throw "Error: " + JSON.stringify(error);
    } 
	else {
      console.log(input.requestIdentifier + ": Successful insert: " + returnData._id);
	  // this is to convert numeric data into a string
      sendResponse(input, 200, "text", "" + returnData._id);
    }
  });

} 



// Select a document
// entityType - eg account, contact etc.
// input - wrapper object
function select(entityType, input) {

  console.log(input.requestIdentifier + ": data_adapter.select() : " + entityType);

  models[entityType].findById(input.documentId,
    function (error, returnData) {
      if (error) {
		// exception will be caught in the server  
        throw "Error: " + JSON.stringify(error);
      } 
	  else {
        if (returnData == null) {
          console.log(input.requestIdentifier + ": Object not found");
		  // send an HTTP not found
          sendResponse(input, 404, "json", "");
        } 
		else {
          console.log(input.requestIdentifier + ": Successful get: " + JSON.stringify(returnData));
          sendResponse(input, 200, "json", JSON.stringify(returnData));
        }
      }
    }
  );
} 


// Select all documents
// entityType - eg account, contact etc.
// input - wrapper object
function select_all(entityType, input) {

  console.log(input.requestIdentifier + ": data_adapter.select_all(): " + entityType);

  models[entityType].find(null, null, opts, function (error, returnData) {
    if (error) {
	  // exception will be caught in the server 	
      throw "Error: " + JSON.stringify(error);
    } 
	else {
      console.log(input.requestIdentifier + ": Success: " + JSON.stringify(returnData));
	  // send HTTP OK
      sendResponse(input, 200, "json", JSON.stringify(returnData));
    }
  });
} 


// Update a document
// entityType - eg account, contact etc.
// input - wrapper object
function update(entityType, input) {

  console.log(input.requestIdentifier + ": data_adapter.update() UPDATE : " + entityType);

  models[entityType].findByIdAndUpdate(input.documentId, input.data, { },
    function (error, returnData) {
      if (error) {
		// exception will be caught in the server   
        throw "Error: " + JSON.stringify(error);
      } 
	  else {
        console.log(input.requestIdentifier + ": Successful update");
		// send HTTP OK
		// this is to convert numeric data into a string
        sendResponse(input, 200, "text", "" + returnData._id);
      }
    }
  );

} 


// Delete a document
// entityType - eg account, contact etc.
// input - wrapper object
function delete_one(entityType, input) {

  console.log(input.requestIdentifier + ": data_adapter.delete() : " + entityType);

  models[input].findByIdAndRemove(input.documentId,
    function (error, returnData) {
      if (error) {
        throw "Error: " + JSON.stringify(error);
      } 
	  else {
        console.log(input.requestIdentifier + ": Successful delete");
		// send HTTP OK
		// this is to convert numeric data into a string
        sendResponse(input, 200, "text", "" + returnData._id);
      }
    }
  );
} 


// Deletes all documents for all entities
// input - wrapper object
function delete_all(input) {

  console.log(input.requestIdentifier + ": data_adapter.delete_all()");
  models.account.remove({}).exec()
  models.contact.remove({}).exec()
  models.opportunity.remove({}).exec()
  models.lead.remove({}).exec()
  models.meeting.remove({}).exec()
  models.call.remove({}).exec()
  // send HTTP OK
  // this is to convert numeric data into a string
  completeResponse(input, 200, "text", "");
}

// Export functions so that the server can access them
exports.insert = insert;
exports.select = select;
exports.update = update;
exports.delete = delete_one;
exports.select_all = select_all;
exports.delete_all = delete_all;
