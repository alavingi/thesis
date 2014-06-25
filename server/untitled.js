  /*
  models.appointment.remove({}, function(error) {
	// exception will be caught in the server   
    if (error) {
      throw "Error: " + JSON.stringify(error);
    } 
	else {
      models.account.remove({}, function(error) {
        if (error) {
          throw "Error: " + JSON.stringify(error);
        } 
		else {
	      models.contact.remove({}, function(error) {
	        if (error) {
	          throw "Error: " + JSON.stringify(error);
	        } 
			else {
		      models.opportunity.remove({}, function(error) {
		        if (error) {
		          throw "Error: " + JSON.stringify(error);
		        } 
				else {
          		  models.lead.remove({}, function(error) {
            		if (error) {
              		  throw "Error: " + JSON.stringify(error);
            	    } 
					else {
	          		  models.meeting.remove({}, function(error) {
	            		if (error) {
	              		  throw "Error: " + JSON.stringify(error);
	            	    } 
						else {
              		  	  models.call.remove({}, function(error) {
                	  	if (error) {
                  	      throw "Error: " + JSON.stringify(error);
                	  	} 
					  	else {
                  	      console.log(input.requestIdentifier + ": Success");
                  	      sendResponse(input, 200, "text", "");
                	    }
              	  	});
            	  }
              });
            }
        });
      }
  });
} 
      });
    }
  });
} 
}
*/
