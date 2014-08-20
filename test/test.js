




function testAddMeeting() {
	

  // var addressAndPort = "http://ec2-54-187-230-68.us-west-2.compute.amazonaws.com:9999";
  var addressAndPort = "http://localhost:9999";

  var uid = "/";
  var method = "post";


  var formAsJSON = JSON.stringify({subject : 'test subject', start_date : null, end_date : null, 'duration' : 5, description : 'test description', meeting_status : 'test status', related_to : 'test related to'});


  // Send to server.
  $.ajax({
    url : addressAndPort + "/" + "meeting" + uid, type : method,
    contentType : "application/json", crossDomain : true, data : formAsJSON
  })
  .done(function(id) {
	  console.log ("Meeting id is " + id)
  })
  .fail(function(jqXHR, status) {
  // Display the error if save is not successful  
  
  console.log("Error is : " + status);
  });

}

function testGetMeeting() {
	
    // var addressAndPort = "http://ec2-54-187-230-68.us-west-2.compute.amazonaws.com:9999";
    var addressAndPort = "http://localhost:9999";
	var uid = "/53f397e15205a048230002f3"
	
    $.ajax({ url : addressAndPort + "/meeting" + uid })
    .done(function(response) { 
  	  console.log(response);
     })
    .fail(function(jqXHR, status) { 
  	  console.log(status);
     });
}

function testGetAllMeetings() {
	

  // var addressAndPort = "http://ec2-54-187-230-68.us-west-2.compute.amazonaws.com:9999";
  var addressAndPort = "http://localhost:9999";

  var uid = "/";

  $.ajax({ url : addressAndPort + "/meeting" })
  .done(function(response) { 
	  console.log(response);
   })
  .fail(function(jqXHR, status) { 
	  console.log(status);
   });

}

testGetMeeting();
testAddMeeting();
testGetAllMeetings();