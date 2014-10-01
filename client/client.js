// Code partially based on the pattern given in Frank W. Zammetti's book


// Server address and port

// var addressAndPort = "http://ec2-54-187-230-68.us-west-2.compute.amazonaws.com:9999";
var addressAndPort = "http://localhost:9999"

// documentId is null for inserts as MongoDB will generate it

var documentId = null;


// True when a network connection is available. When a network connection is unavailable
// the application runs in read-only mode

var phoneConnected = true;


// If a page has already been visited before

var pageAlreadyVisited = {
  account : false,
  contact : false,
  opportunity : false,
  lead : false,
  meeting : false,
  call : false
};

var count = {account : 0, contact : 0, lead : 0,
	opportunity : 0, meeting : 0, call : 0};


// ----------------------------------------------------------------------------
// EVENT HANDLERS.
// ----------------------------------------------------------------------------


// JQuery Mobile defaults are set before starting the application

$(document).on("mobileinit", function() {

  // Set JQM defaults.
  $.mobile.defaultPageTransition  = "none";
  $.mobile.defaultDialogTransition  = "none";
  $.mobile.phonegapNavigationEnabled = true;
  $.mobile.loader.prototype.options.text = "...Please Wait...";
  $.mobile.loader.prototype.options.textVisible = true;
  
  $.mobile.ajaxEnabled = false;

});

// Check for network connectivity once the UI is built

$(document).on("ready", function() {

  // Determine network connectivity when running within PhoneGap
  
  if (navigator && navigator.connection &&
    navigator.connection.type == Connection.NONE
  ) {
    displayMessage();
  } else {
    downloadLocalCopy();
  }

  // Add a click handler to the clear confirmation dialog's "yes" button.
  $("#confirmClearYes").on("click", function() {
    clearData();
  });

});


// ----------------------------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------------------------


/**
 * Show the dialog when network connectivity is unavailable.
 */
function displayMessage() {

  phoneConnected = false;
  $("#infoDialogHeader").html("Network not available");
  $("#infoDialogContent").html(
    "Network not available. Application will run in read-only mode"
  );
  $.mobile.changePage($("#infoDialog"), { role : "dialog" });

} // End displayMessage().


// Copies server data to local storage upon startup

function downloadLocalCopy() {

  $.mobile.loading("show");

  
  var downloadVariables = {downloadcomplete_account : false, downloadcomplete_contact : false,
    downloadcomplete_opportunity : false, downloadcomplete_lead : false,
	downloadcomplete_meeting : false, downloadcomplete_call : false,
    data_account : null, data_contact : null,
    data_opportunity : null, data_lead : null,
	data_meeting : null, data_call : null};
  

  // This function's logic is only executed after all the ajax calls are complete. The downloaded server data is
  // copied into local storage
  var copyLocal = function(entityType, response) {

    // Update variables after each ajax call
    downloadVariables["downloadcomplete_" + entityType] = true;
    downloadVariables["data_" + entityType] = response;

    // First check if all flags have been set
    if (downloadVariables.downloadcomplete_account && downloadVariables.downloadcomplete_contact &&
      downloadVariables.downloadcomplete_opportunity && downloadVariables.downloadcomplete_lead && 
      downloadVariables.downloadcomplete_meeting && downloadVariables.downloadcomplete_call) {

      // Next check if all data is available
      if (downloadVariables.data_account && downloadVariables.data_contact &&
        downloadVariables.data_opportunity && downloadVariables.data_lead &&
		downloadVariables.data_meeting && downloadVariables.data_call
      ) {

        // Clear localStorage and then populate it with the fresh data.
        window.localStorage.clear();
        var entityTypes = [ "account", "contact", "opportunity", "lead", "meeting", "call" ];
        for (var i = 0; i < entityTypes.length; i++) {
          var type = entityTypes[i];
          var data = JSON.parse(downloadVariables["data_" + type]);
          var len = data.length;
          var lst = window.localStorage;
          for (var j = 0; j < len; j++) {
            var entity = data[j];
            lst.setItem(type + "_" + entity._id, JSON.stringify(entity));
          }
        }

      } else {

        // data for at least one entity is unavailable, so turn on read-only mode
        displayMessage();

      }
      
      downloadVariables = null;

      $.mobile.loading("hide");

    }

  };

  // Download all accounts.
  $.ajax({ url : addressAndPort + "/account" })
  .done(function(response) { copyLocal("account", response); })
  .fail(function(jqXHR, status) { copyLocal("account", null); });

  // Download all contacts.
  $.ajax({ url : addressAndPort + "/contact" })
  .done(function(response) { copyLocal("contact", response); })
  .fail(function(jqXHR, status) { copyLocal("contact", null); });

  // Download all opportunities.
  $.ajax({ url : addressAndPort + "/opportunity" })
  .done(function(response) { copyLocal("opportunity", response); })
  .fail(function(jqXHR, status) { copyLocal("opportunity", null); });

  // Download all leads.
  $.ajax({ url : addressAndPort + "/lead" })
  .done(function(response) { copyLocal("lead", response); })
  .fail(function(jqXHR, status) { copyLocal("lead", null); });
  
  // Download all meetings.
  $.ajax({ url : addressAndPort + "/meeting" })
  .done(function(response) { copyLocal("meeting", response); })
  .fail(function(jqXHR, status) { copyLocal("meeting", null); });

  // Download all calls.
  $.ajax({ url : addressAndPort + "/call" })
  .done(function(response) { copyLocal("call", response); })
  .fail(function(jqXHR, status) { copyLocal("call", null); });

} // End downloadLocalCopy()


// Copy local storage into memory as key-value pairs
// The key contains the entity type

function copyToMemory(entityType) {

  var items = [ ];

  
  var lst = window.localStorage;
  for (var itemKey in lst) {
	// The key is of the form entityType_Id  
    if (itemKey.indexOf(entityType) == 0) {
      var sObj = lst.getItem(itemKey);
      items.push(JSON.parse(sObj));
	  // update counts
	  count[entityType]++
    }
  }

  return items;

} // End copyToMemory().


/**
 * Show a list view.
 *
 * @param entityType The type of list to show.
 */
function displayListView(entityType) {

  // Flip to list view and ensure menu is closed.
  $("#" + entityType + "Entry").hide("fast");
  $("#" + entityType + "List").show("fast");
  $("#" + entityType + "Menu" ).popup("close");

  documentId = null;
  $.mobile.changePage( entityType +"Page.html", { transition: "none"} );
  document.getElementById(entityType + "EntryForm").reset();

} // End displayListView().


// Insert or update an entity of a given type

function saveEntity(entityType) {

  // Validate the form before saving
  if (!validations["check_" + entityType](entityType)) {
    $("#infoDialogHeader").html("Error");
    $("#infoDialogContent").html(
      "Please provide valid values for fields"
    );
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
    return;
  }

  // Scrim screen for the duration of the call.
  $.mobile.loading("show");

  // Flip to list view and ensure menu is closed.
  $("#" + entityType + "Entry").hide();
  $("#" + entityType + "List").show();
  $("#" + entityType + "Menu" ).popup("close");

  // Use POST  for inserts and PUT for updates
  // documentId is not needed for inserts as it will be generated by the database
  var method = "post";
  var uid = "";
  if (documentId) {
    method = "put";
    uid = "/" + documentId;
  }

  // Get form data and then clear the form and reset documentId.
  var formAsJSON = convertFormToJSONString(entityType);

  documentId = null;
  document.getElementById(entityType + "EntryForm").reset();

  // Send to server.
  $.ajax({
    url : addressAndPort + "/" + entityType + uid, type : method,
    contentType: "application/json", data : formAsJSON
  })
  .done(function(id) {
    // The server returns the documentID, which together with _v (always zero)
    // is added to the JSON string before saving to local storage
    formAsJSON = formAsJSON.slice(0, formAsJSON.length - 1);
    formAsJSON = formAsJSON + ",\"__v\":\"0\",\"_id\":\"" + id + "\"}";
    window.localStorage.setItem(entityType + "_" + id, formAsJSON);
    // Update list view
    updateList(entityType);
    // Update UI
    $.mobile.loading("hide");
    $("#infoDialogHeader").html("Success");
    $("#infoDialogContent").html("Save to server complete");
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  })
  .fail(function(jqXHR, status) {
	// Display the error if save is not successful  
    $.mobile.loading("hide");
    $("#infoDialogHeader").html("Error");
    $("#infoDialogContent").html(status);
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  });

} // End saveEntity().


// Convert form data into a JSON string

function convertFormToJSONString(entityType) {

  var formData = $("#" + entityType + "EntryForm").serializeArray();
  var jsonObject = { };
  for (var i = 0; i < formData.length; i++) {
    var formField = formData[i];
    jsonObject[formField.name] = formField.value;
  }
  return JSON.stringify(jsonObject);

} // End convertFormToJSONString();


// Form validation functions for validating required fields

var validations = {

  /**
   * Validate account form.
   */
  check_account : function() {
	var phoneregex = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
	var emailregex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	var urlregex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi; 
	var zipregex = /^\d{5}$/;
	
	var phone = $("#phone").val();
	var email = $("#accountEMail").val();
	var url = $("#url").val();
	var zipcode = $("#zipcode").val();
	
	if (isEmpty("account_name")) { return false; }
	
	if ((!isEmpty("phone")) && (!(phoneregex.test(phone)))) { return false; }
	if (!isEmpty("accountEMail") && !emailregex.test(email)) { return false; }
	if (!isEmpty("url") && !urlregex.test(url)) { return false; }
	if ((!isEmpty("zipcode")) && (!(zipregex.test(zipcode)))) { return false; }
    
    return true;
  },

  /**
   * Validate contact form.
   */
  check_contact : function() {
  	var phoneregex = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
  	var emailregex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  	var birthdateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
	var zipregex = /^\d{5}$/;
	
	var phone = $("#phone").val();
	var email = $("#contactEMail").val();
	var birthDate = $("#birthDate").val();
	var zipcode = $("#zipcode").val();
	  
    if (isEmpty("first_name")) { return false; }
    if (isEmpty("last_name")) { return false; }
	
	if (!isEmpty("phone") && !phoneregex.test(phone)) { return false; }
	if (!isEmpty("contactEMail") && !emailregex.test(email)) { return false; }
	if (!isEmpty("birthDate") && !birthdateregex.test(birthDate)) { return false; }
	if (!isEmpty("zipcode") && !zipregex.test(zipcode)) { return false; }
	
    return true;
  },

  /**
   * Validate opportunity form.
   */
  check_opportunity : function() {
	var amountregex = /[0-9 -()+]+$/;  
	
	var amount = $("#amount").val(); 
	  
    if (isEmpty("opportunity_name")) { return false; }
	
	if (!isEmpty("amount") && !amountregex.test(amount)) { return false; }
    
    return true;
  },

  /**
   * Validate lead form.
   */
  check_lead : function() {
  	var revenueregex = /[0-9 -()+]+$/; 
	var employeesregex = /[0-9 -()+]+$/; 
	
  	var revenue = $("#revenue").val();
	var employees = $("#employees").val();    
	  
    if (isEmpty("company")) { return false; }
	
	if (!isEmpty("revenue") && !revenueregex.test(revenue)) { return false; }
	if (!isEmpty("employees") && !employeesregex.test(employees)) { return false; }
    return true;
  },
  
  /**
   * Validate meeting form.
   */
  check_meeting : function() {
	var dateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
	var durationregex = /[0-9 -()+]+$/; 
	
	var startDate = $("#start_date").val();
	var endDate = $("#end_date").val();
	var duration = $("#duration").val();
	  
    if (isEmpty("subject")) { return false; }
	
	if (!isEmpty("start_date") && !dateregex.test(startDate)) { return false; }
	if (!isEmpty("end_date") && !dateregex.test(endDate)) { return false; }
	if (!isEmpty("duration") && !durationregex.test(duration)) { return false; }
    
    return true;
  },

  /**
   * Validate call form.
   */
  check_call : function() {
  	var dateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
	var durationregex = /[0-9 -()+]+$/; 
	
  	var callDate = $("#call_date").val();
  	var duration = $("#duration").val();
	  
    if (isEmpty("subject")) { return false; }
	
  	if (!isEmpty("call_date") && !dateregex.test(callDate)) { return false; }
  	if (!isEmpty("duration") && !durationregex.test(duration)) { return false; }
	
    return true;
  }

};



// Delete an entity of a given type
 
function deleteEntity(entityType) {

  // Display waiting message
  $.mobile.loading("show");

  // Flip to list view and ensure menu is closed.
  $("#" + entityType + "Entry").hide();
  $("#" + entityType + "List").show();
  $("#" + entityType + "Menu" ).popup("close");

  var uid = "/" + documentId;

  // Reset form and documentId.
  documentId = null;
  document.getElementById(entityType + "EntryForm").reset();

  // Send to server.
  $.ajax({ url : addressAndPort + "/" + entityType + uid, type : "delete" })
  .done(function(response) {
    // Delete from localStorage.
    window.localStorage.removeItem(entityType + "_" + response);
    // Update list view
    updateList(entityType);
    // Now update the UI as appropriate and we're done.
    $.mobile.loading("hide");
    $("#infoDialogHeader").html("Success");
    $("#infoDialogContent").html("Delete from server complete");
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  })
  .fail(function(jqXHR, status) {
    $.mobile.loading("hide");
	// Display error message if delete fails
    $("#infoDialogHeader").html("Error");
    $("#infoDialogContent").html(status);
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  });

} // End deleteEntity().


// Run when a page is first loaded

function initialPageLoad(entityType) {

  if (!pageAlreadyVisited[entityType]) {

    $.mobile.loading("show");

    // Populate the list.
    updateList(entityType);

    // If the network is not available, disable any write ability
    if (!phoneConnected) {
      $("#" + entityType + "NewLink").remove();
      $("#" + entityType + "SaveButton").button("disable");
    }

    pageAlreadyVisited[entityType] = true;
    $.mobile.loading("hide");

  }

} // End initialPageLoad().


// Update unnumbered list based on search criterion
function updateList(entityType, searchField1, searchValue1, searchField2, searchValue2) {

  // Get reference to listview's UL element and remove existing children.
  var ul = $("#" + entityType + "ListUL");
  // First clear the list
  ul.children().remove();
  
  // Copy from localStorage to memory.
  var items = copyToMemory(entityType);
  
  // apply search criterion, if specified.
  var len = items.length;
  for (var i = 0; i < len; i++) {
    var item = items[i];
    // If search criterion is not met, do not add to list
	if (searchField1 && searchValue1 &&
	      item[searchField1] != searchValue1 
	    ) {
	    continue;
	}
    else if (searchField1 && searchValue1 && searchField2 && searchValue2 &&
      (item[searchField1] != searchValue1 || item[searchField2] != searchValue2)
    ) {
      continue;
    }
	 
    // Otherwise add to list
    var liText = "";
    if (entityType == "contact") {
      liText = item.last_name + ", " + item.first_name;
    } 
	else if (entityType == "account"){
      liText = item.account_name;
    }
	else if (entityType == "opportunity"){
      liText = item.opportunity_name;
    }
	else if (entityType == "lead"){
      liText = item.company;
    }
	else if (entityType == "meeting"){
      liText = item.subject;
    }
	else if (entityType == "call"){
      liText = item.subject;
    }
	// Clicking on a list item displays the edit screen
    ul.append(
      "<li onClick=\"editEntity('" + entityType + "', '" + item._id + "');\"" +
      "id=\"" + item._id + "\"><a href='#'>" + liText + "</a></li>"
    );
  }

  // Refresh the listview.
  ul.listview("refresh");

} // End updateList().


// Add an entity

function newItem(entityType) {

  // Clear entry form and reset documentId.
  documentId = null;
  $.mobile.changePage( entityType + "Page.html", { transition: "none"} );
  document.getElementById(entityType + "EntryForm").reset();

  // Close list view and display data entry form
  $("#" + entityType + "Entry").show("fast");
  $("#" + entityType + "List").hide("fast");
  $("#" + entityType + "Menu" ).popup("close");

  // Disable delete button 
  $("#" + entityType + "DeleteButton").button("disable");

} // End newItem().


// View or edit an entity

function editEntity(entityType, entityId) {

  // Save the entity Id
  documentId = entityId;

  // Fetch the entity from local storage
  var entity = JSON.parse(window.localStorage.getItem(entityType + "_" + entityId));
  // Loop through the object and populate the form except for the _v and _id fields
  for (field in entity) {
    if (field != "_id" && field != "__v") {
      $("#" + entityType + "EntryForm [name=" + field + "]").val(entity[field]).trigger("change");
    }
  }

  // Close the list view and display entry form
  $("#" + entityType + "Entry").show();
  $("#" + entityType + "List").hide();
  $("#" + entityType + "Menu" ).popup("close");

  // Reenable delete button 
  $("#" + entityType + "DeleteButton").button("enable");

} // End editEntity().


// Clears all data from the server as well as local storage 
function clearData() {
  // Show waiting message
  $.mobile.loading("show");
  // Make server RESTful call
  $.ajax({ url : addressAndPort + "/clear" })
  .done(function(response) {
    // Now clear localStorage.
    window.localStorage.clear();
    $.mobile.loading("hide");
    $("#infoDialogHeader").html("Success!");
    $("#infoDialogContent").html("Data cleared");
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  })
  .fail(function(jqXHR, status) {
	// Display error message  
    $.mobile.loading("hide");
    $("#infoDialogHeader").html("Data clear failure");
    $("#infoDialogContent").html("Data not cleared");
    $.mobile.changePage($("#infoDialog"), { role : "dialog" });
  });

} // End clearData().


// Validate required form fields
function isEmpty(htmlId) {

  var formField = $("#" + htmlId).val();
  // Field is empty
  if (formField === null) {
    return true;
  } else if (formField === undefined) {
    return true;
  } else if (formField === "") {
    return true;
  }
  // Field has been populated
  return false;

} // End isEmpty().

// Score a lead
function scoreLead() {
	var distances = [];
	var form = JSON.parse(convertFormToJSONString("lead"));
    // Copy from localStorage to memory.
    var items = copyToMemory("lead");
    
	// calculate distances
    var len = items.length;
    for (var i = 0; i < len; i++) {
      var item = items[i];
	  var distance = Math.sqrt(Math.pow((form.revenue - item.revenue), 2) / form.revenue + Math.pow((form.employees - item.employees), 2) / form.employees);
	  var priority = 0;
	  if (item.priority)
	  	priority = item.priority;
	  var itemdistance = {dist:distance, prior:priority}
	  distances.push(itemdistance);
	  
    }
	
	// sort by distance
	var sorted = distances.sort(function(a, b) {
	   return a.value - b.value;
	});

	var keys = Object.keys(sorted);
	//for (var i = 0, len = sorted.length; i < len; ++i) {
	//    keys[i] = sorted[i].key;
	// }
	
	// take the first three keys or neighbors
	var priority1 = 0, priority2 = 0, priority3 = 0;
	for (var i = 0; i < sorted.length; i++) {
		var prior = Object.keys( sorted[i] )[ 1 ];
		var priority = sorted[i][prior];
		if (priority == 1){
			priority1++;
		}
		else if (priority == 2){
			priority2++;
		}
		else if (priority == 3){
			priority3++;
		}
	}
	
	 var maxpriority =  Math.max(priority1, priority2, priority3);
	 console.log("priority is : " + $("#priority").val());
	 $("#priority").val(maxpriority);
	
}

// Score an opportunity
function scoreOpportunity() {
	var distances = [];
	var form = JSON.parse(convertFormToJSONString("opportunity"));
    // Copy from localStorage to memory.
    var items = copyToMemory("opportunity");
    
	// calculate distances
    var len = items.length;
    for (var i = 0; i < len; i++) {
      var item = items[i];
	  var distance = Math.sqrt(Math.pow((form.amount - item.amount), 2) / form.amount + Math.pow((form.probability - item.probability), 2) / form.probability);
	  var priority = 0;
	  if (item.priority)
	  	priority = item.priority;
	  var itemdistance = {dist:distance, prior:priority}
	  distances.push(itemdistance);
	  
    }
	
	// sort by distance
	var sorted = distances.sort(function(a, b) {
	   return a.value - b.value;
	});

	var keys = Object.keys(sorted);
	//for (var i = 0, len = sorted.length; i < len; ++i) {
	//    keys[i] = sorted[i].key;
	// }
	
	// take the first three keys or neighbors
	var priority1 = 0, priority2 = 0, priority3 = 0;
	for (var i = 0; i < sorted.length; i++) {
		var prior = Object.keys( sorted[i] )[ 1 ];
		var priority = sorted[i][prior];
		if (priority == 1){
			priority1++;
		}
		else if (priority == 2){
			priority2++;
		}
		else if (priority == 3){
			priority3++;
		}
	}
	
	 var maxpriority =  Math.max(priority1, priority2, priority3);
	 console.log("priority is : " + $("#priority").val());
	 $("#priority").val(maxpriority);
	 	
}
