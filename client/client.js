
// Code partially based on the pattern given in Frank W. Zammetti's book
// Server address and port
// var addressAndPort = "http://ec2-54-68-187-203.us-west-2.compute.amazonaws.com:9999";
var addressAndPort = "http://localhost:9999"

// documentId is null for inserts as MongoDB will generate it

var documentId = null;


// True when a network connection is available. When a network connection is unavailable
// the application runs in read-only mode

var phoneConnected = true;


// If a page has already been visited before

var pageAlreadyVisited = {
    account: false,
    contact: false,
    opportunity: false,
    lead: false,
    meeting: false,
    call: false
};

var count = {
    account: 0,
    contact: 0,
    lead: 0,
    opportunity: 0,
    meeting: 0,
    call: 0
};


// ----------------------------------------------------------------------------
// EVENT HANDLERS.
// ----------------------------------------------------------------------------


// JQuery Mobile defaults are set before starting the application

$(document).on("mobileinit", function() {

    // Set JQM defaults.
    $.mobile.defaultPageTransition = "none";
    $.mobile.defaultDialogTransition = "none";
    $.mobile.phonegapNavigationEnabled = true;
    $.mobile.loader.prototype.options.text = "...Please Wait...";
    $.mobile.loader.prototype.options.textVisible = true;

    $.mobile.page.prototype.options.addBackBtn = true;

    // $.mobile.ajaxEnabled = false;
    // $.mobile.pageLoadErrorMessage = "";

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


// Dynamically changes the theme of all UI elements on all pages,
// also pages not yet rendered (enhanced) by jQuery Mobile.
/*
$.mobile.changeGlobalTheme = function(theme)
{
    // These themes will be cleared, add more
    // swatch letters as needed.
    var themes = " a b c d e";

    // Updates the theme for all elements that match the
    // CSS selector with the specified theme class.
    function setTheme(cssSelector, themeClass, theme)
    {
        $(cssSelector)
            .removeClass(themes.split(" ").join(" " + themeClass + "-"))
            .addClass(themeClass + "-" + theme)
            .attr("data-theme", theme);
    }

    // Add more selectors/theme classes as needed.
    setTheme(".ui-mobile-viewport", "ui-overlay", theme);
    setTheme("[data-role='page']", "ui-body", theme);
    setTheme("[data-role='header']", "ui-bar", theme);
    setTheme("[data-role='listview'] > li", "ui-bar", theme);
    setTheme(".ui-btn", "ui-btn-up", theme);
    setTheme(".ui-btn", "ui-btn-hover", theme);
};


// ----------------------------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------------------------


// Change global theme

function setGlobalTheme(theme) {
	$.mobile.changeGlobalTheme(theme);
	$.mobile.changePage(window.location.href, {reloadPage : true, transition : "none"});
}
*/

/**
 * Show the dialog when network connectivity is unavailable.
 */
function displayMessage() {

        phoneConnected = false;
        $("#infoDialogHeader").html("Network not available");
        $("#infoDialogContent").html(
            "Network not available. Application will run in read-only mode"
        );
        $.mobile.changePage($("#infoDialog"), {
            role: "dialog"
        });

    } // End displayMessage().


// Copies server data to local storage upon startup

function downloadLocalCopy() {

        $.mobile.loading("show");


        var downloadVariables = {
            downloadcomplete_account: false,
            downloadcomplete_contact: false,
            downloadcomplete_opportunity: false,
            downloadcomplete_lead: false,
            downloadcomplete_meeting: false,
            downloadcomplete_call: false,
            data_account: null,
            data_contact: null,
            data_opportunity: null,
            data_lead: null,
            data_meeting: null,
            data_call: null
        };


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
                    var entityTypes = ["account", "contact", "opportunity", "lead", "meeting", "call"];
                    for (var i = 0; i < entityTypes.length; i++) {
                        var type = entityTypes[i];
                        var data = JSON.parse(downloadVariables["data_" + type]);
                        var len = data.length;
                        var lst = window.localStorage;
                        for (var j = 0; j < len; j++) {
                            var entity = data[j];
                            lst.setItem(type + "_" + entity._id, JSON.stringify(entity));
			    // update counts
			    count[type]++;
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
        $.ajax({
                url: addressAndPort + "/account"
            })
            .done(function(response) {
                copyLocal("account", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("account", null);
            });

        // Download all contacts.
        $.ajax({
                url: addressAndPort + "/contact"
            })
            .done(function(response) {
                copyLocal("contact", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("contact", null);
            });

        // Download all opportunities.
        $.ajax({
                url: addressAndPort + "/opportunity"
            })
            .done(function(response) {
                copyLocal("opportunity", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("opportunity", null);
            });

        // Download all leads.
        $.ajax({
                url: addressAndPort + "/lead"
            })
            .done(function(response) {
                copyLocal("lead", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("lead", null);
            });

        // Download all meetings.
        $.ajax({
                url: addressAndPort + "/meeting"
            })
            .done(function(response) {
                copyLocal("meeting", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("meeting", null);
            });

        // Download all calls.
        $.ajax({
                url: addressAndPort + "/call"
            })
            .done(function(response) {
                copyLocal("call", response);
            })
            .fail(function(jqXHR, status) {
                copyLocal("call", null);
            });

    } // End downloadLocalCopy()


// Copy local storage into memory as key-value pairs
// The key contains the entity type

function copyToMemory(entityType) {

        var items = [];


        var lst = window.localStorage;
        for (var itemKey in lst) {
            // The key is of the form entityType_Id  
            if (itemKey.indexOf(entityType) == 0) {
                var sObj = lst.getItem(itemKey);
                items.push(JSON.parse(sObj));                
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

        $.mobile.changePage(entityType + "Page.html", {
            reload: true,
            transition: "none"
        });
        // Flip to list view and ensure menu is closed.
        $("#" + entityType + "Entry").hide("fast");
        $("#" + entityType + "List").show("fast");
        
        $("#" + entityType + "ListButton").addClass("disabled");
        $("#" + entityType + "NewButton").removeClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });

        documentId = null;
        // $.mobile.changePage( entityType +"Page.html", { transition: "none"} );
        document.getElementById(entityType + "EntryForm").reset();

    } // End displayListView().


// Insert or update an entity of a given type

function saveEntity(entityType) {
        var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        var deviceType = "";
        var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        if (width <= 640) {
            deviceType = "phone";
        } else if (width > 1040) {
            deviceType = "desktop";
        } else {
            deviceType = "tablet";
        }

        // Validate the form before saving
        if (!validations["check_" + entityType](entityType)) {
            $("#infoDialogHeader").html("Error");
            $("#infoDialogContent").html(
                "Please provide valid values for fields"
            );
            $.mobile.changePage($("#infoDialog"), {
                role: "dialog"
            });
            return;
        }

        // Scrim screen for the duration of the call.
        $.mobile.loading("show");

        // Flip to list view and ensure menu is closed.
        $("#" + entityType + "Entry").hide();
        $("#" + entityType + "List").show();
        // $("#" + entityType + "Menu" ).popup("close");
        $("#" + entityType + "ListButton").addClass("disabled");
        $("#" + entityType + "NewButton").removeClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });

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
                url: addressAndPort + "/" + entityType + uid,
                type: method,
                contentType: "application/json",
                data: formAsJSON
            })
            .done(function(id) {
                // The server returns the documentID, which together with _v (always zero)
                // is added to the JSON string before saving to local storage
                formAsJSON = formAsJSON.slice(0, formAsJSON.length - 1);
                formAsJSON = formAsJSON + ",\"__v\":\"0\",\"_id\":\"" + id + "\"}";
                window.localStorage.setItem(entityType + "_" + id, formAsJSON);
		// update counts
		if (method == "post") {
                    count[entityType]++;
		}
                // Update list view
                updateList(entityType + "ListUL", entityType, deviceType);
                // Update UI
                $.mobile.loading("hide");
                $("#infoDialogHeader").html("Success");
                $("#infoDialogContent").html("Save to server complete");
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
            })
            .fail(function(jqXHR, status) {
                // Display the error if save is not successful  
                $.mobile.loading("hide");
                $("#infoDialogHeader").html("Error");
                $("#infoDialogContent").html(status);
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
            });

    } // End saveEntity().


// Convert form data into a JSON string

function convertFormToJSONString(entityType) {

        var formData = $("#" + entityType + "EntryForm").serializeArray();
        var jsonObject = {};
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
    check_account: function() {
        var phoneregex = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
        var emailregex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var urlregex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var zipregex = /^\d{5}$/;

        var phone = $("#phone").val();
        var email = $("#accountEMail").val();
        var url = $("#url").val();
        var zipcode = $("#zip").val();
        var accountName = $("#account_name").val();;

        if (!accountName) {
            return false;
        }

        if (phone && !phoneregex.test(phone)) {
            return false;
        }
        if (email && !emailregex.test(email)) {
            return false;
        }
        if (url && !urlregex.test(url)) {
            return false;
        }
        if (zipcode && !zipregex.test(zipcode)) {
            return false;
        }

        return true;
    },

    /**
     * Validate contact form.
     */
    check_contact: function() {
        var phoneregex = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
        var emailregex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var birthdateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
        var zipregex = /^\d{5}$/;

        var phone = $("#phone").val();
        var email = $("#contactEMail").val();
        var birthDate = $("#birthDate").val();
        var zipcode = $("#zip").val();
        var first_name = $("#first_name");
        var last_name = $("#last_name");

        if (!first_name) {
            return false;
        }
        if (!last_name) {
            return false;
        }

        if (phone && !phoneregex.test(phone)) {
            return false;
        }
        if (email && !emailregex.test(email)) {
            return false;
        }
        if (birthDate && !birthdateregex.test(birthDate)) {
            return false;
        }
        if (zipcode && !zipregex.test(zipcode)) {
            return false;
        }

        return true;
    },

    /**
     * Validate opportunity form.
     */
    check_opportunity: function() {
        var amountregex = /[0-9 -()+]+$/;
        var opportunity_name = $("#opportunity_name");
        var amount = $("#amount").val();

        if (!opportunity_name) {
            return false;
        }

        if (amount && !amountregex.test(amount)) {
            return false;
        }

        return true;
    },

    /**
     * Validate lead form.
     */
    check_lead: function() {
        var revenueregex = /[0-9 -()+]+$/;
        var employeesregex = /[0-9 -()+]+$/;

        var revenue = $("#revenue").val();
        var employees = $("#employees").val();
        var company = $("#company").val();

        if (!company) {
            return false;
        }

        if (revenue && !revenueregex.test(revenue)) {
            return false;
        }
        if (employees && !employeesregex.test(employees)) {
            return false;
        }

        return true;
    },

    /**
     * Validate meeting form.
     */
    check_meeting: function() {
        var dateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
        var durationregex = /[0-9 -()+]+$/;

        var startDate = $("#start_date").val();
        var endDate = $("#end_date").val();
        var duration = $("#duration").val();
        var subject = $("#subject").val();

        if (!subject) {
            return false;
        }

        if (start_date && !dateregex.test(startDate)) {
            return false;
        }
        if (end_date && !dateregex.test(endDate)) {
            return false;
        }
        if (duration && !durationregex.test(duration)) {
            return false;
        }

        return true;
    },

    /**
     * Validate call form.
     */
    check_call: function() {
        var dateregex = /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
        var durationregex = /[0-9 -()+]+$/;

        var callDate = $("#call_date").val();
        var duration = $("#duration").val();
        var subject = $("#subject").val();

        if (!subject) {
            return false;
        }

        if (call_date && !dateregex.test(callDate)) {
            return false;
        }
        if (duration && !durationregex.test(duration)) {
            return false;
        }

        return true;
    }

};



// Delete an entity of a given type

function deleteEntity(entityType) {
        var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        var deviceType = "";
        if (width <= 640) {
            deviceType = "phone";
        } else if (width > 1040) {
            deviceType = "desktop";
        } else {
            deviceType = "tablet";
        }

        // Display waiting message
        $.mobile.loading("show");

        // Flip to list view and ensure menu is closed.
        $("#" + entityType + "Entry").hide();
        $("#" + entityType + "List").show();

        // $("#" + entityType + "Menu" ).popup("close");
        $("#" + entityType + "ListButton").addClass("disabled");
        $("#" + entityType + "NewButton").removeClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });

        var uid = "/" + documentId;

        // Reset form and documentId.
        documentId = null;
        document.getElementById(entityType + "EntryForm").reset();

        // Send to server.
        $.ajax({
                url: addressAndPort + "/" + entityType + uid,
                type: "delete"
            })
            .done(function(response) {
                // Delete from localStorage.
                window.localStorage.removeItem(entityType + "_" + response);
		// update counts
                count[entityType]--;
                // Update list view
                updateList(entityType + "ListUL", entityType, deviceType);
                // Now update the UI as appropriate and we're done.
                $.mobile.loading("hide");
                $("#infoDialogHeader").html("Success");
                $("#infoDialogContent").html("Delete from server complete");
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
            })
            .fail(function(jqXHR, status) {
                $.mobile.loading("hide");
                // Display error message if delete fails
                $("#infoDialogHeader").html("Error");
                $("#infoDialogContent").html(status);
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
            });

    } // End deleteEntity().


// Run when a page is first loaded

function initialPageLoad(entityType) {



        if (!pageAlreadyVisited[entityType]) {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            var deviceType = "";
            if (width <= 640) {
                deviceType = "phone";
            } else if (width > 1040) {
                deviceType = "desktop";
            } else {
                deviceType = "tablet";
            }
            var listName = entityType + "ListUL";
            $.mobile.loading("show");

            // Populate the list.
            updateList(listName, entityType, deviceType);
            $("#" + entityType + "ListButton").addClass("disabled");
            $("#" + entityType + "NewButton").removeClass("disabled");
            $('body').on('click', 'a.disabled', function(event) {
                event.preventDefault();
            });

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
function updateList(listName, entityType, deviceType, searchField1, searchValue1, searchField2, searchValue2, searchField3, searchValue3) {

        var now = new Date();
        // First clear the list
        var ul = $("#" + listName);
        ul.children().remove();

        // Copy from localStorage to memory.
        var items = copyToMemory(entityType);
        if (items.length == 0) {
            return;
        }

        if (entityType == "contact") {
            items.sort(function(a, b) {
                if (a.last_name < b.last_name) return -1;
                if (a.last_name > b.last_name) return 1;
                if (a.first_name < b.first_name) return -1;
                if (a.first_name > b.first_name) return 1;
                return 0;
            });
        } else if (entityType == "account") {
            items.sort(function(a, b) {
                if (a.account_name < b.account_name) return -1;
                if (a.account_name > b.account_name) return 1;
                return 0;
            });
        } else if (entityType == "opportunity") {
            items.sort(function(a, b) {
                if (a.opportunity_name < b.opportunity_name) return -1;
                if (a.opportunity_name > b.opportunity_name) return 1;
                return 0;
            });
        }
        // Sort leads by priority and revenue
        else if (entityType == "lead") {
            items.sort(function(a, b) {
                if (a.priority == "HIGH" && (b.priority == "MEDIUM" || b.priority == "LOW")) return -1;
                if (a.priority == "MEDIUM" && (b.priority == "LOW")) return -1;
                if (a.priority == "LOW" && (b.priority == "MEDIUM" || b.priority == "HIGH")) return 1;
                if (a.priority == "MEDIUM" && (b.priority == "HIGH")) return 1;
                if (a.revenue > b.revenue) return -1;
                if (a.revenue < b.revenue) return 1;
                return 0;
            });
        } else if (entityType == "meeting") {
            items.sort(function(a, b) {
                if (a.start_date < b.start_date) return -1;
                if (a.start_date > b.start_date) return 1;
                return 0;
            });
        } else if (entityType == "call") {
            items.sort(function(a, b) {
                if (a.subject < b.subject) return -1;
                if (a.subject > b.subject) return 1;
                return 0;
            });
        }
        if (deviceType == "tablet" || deviceType == "desktop") {
            if (listName == "topLeadsUL" && deviceType == "desktop") {
                ul.append("<table><tr><td colspan='3'><div style='font-weight:bold;text-decoration: underline;'><h4>TOP LEADS</h4><br></div></td></tr></table><table class='listHeader'><tr><td>Company</td><td>First Name</td><td>Last Name</td><td>Priority</td></tr></table>");
            } else if (listName == "topLeadsUL" && deviceType == "tablet") {
                ul.append("<table><tr><td colspan='3'><div style='font-weight:bold;text-decoration: underline;'><h4>TOP LEADS</h4><br></div></td></tr></table><table class='listHeader'><tr><td>First Name</td><td>Last Name</td><td>Priority</td></tr></table>");
            } else if (listName == "upcomingMeetingsUL") {
                if (deviceType == "tablet") {
                    ul.append("<table><tr><td colspan='3'><div style='font-weight:bold;text-decoration: underline;'><h4>UPCOMING MEETINGS</h4><br></div></td></tr></table><table class='listHeader'><tr><td>Subject</td><td>Start Date</td></tr></table>");
                } else if (deviceType == "desktop") {
                    ul.append("<table><tr><td colspan='3'><div style='font-weight:bold;text-decoration: underline;'><h4>UPCOMING MEETINGS</h4><br></div></td></tr></table><table class='listHeader'><tr><td>Subject</td><td>Start Date</td><td>Status</td></tr></table>");
                }
            } else if (listName == "accountListUL") {
                if (deviceType == "tablet") {
                    ul.append("<table class='listHeader'><tr><td>Account Name</td><td>Phone</td></tr></table>");
                } else if (deviceType == "desktop") {
                    ul.append("<table class='listHeader'><tr><td>Account Name</td><td>Phone</td><td>Email</td></tr></table>");
                }
            } else if (listName == "contactListUL") {
                if (deviceType == "tablet") {
                    ul.append("<table class='listHeader'><tr><td>First Name</td><td>Last Name</td><td>Phone</td></tr></table>");

                } else if (deviceType == "desktop") {
                    ul.append("<table class='listHeader'><tr><td>First Name</td><td>Last Name</td><td>Phone</td><td>Email</td></tr></table>");

                }
            } else if (listName == "leadListUL" && deviceType == "desktop") {
                ul.append("<table class='listHeader'><tr><td>Company</td><td>First Name</td><td>Last Name</td><td>Priority</td></tr></table>");
            } else if (listName == "leadListUL" && deviceType == "tablet") {
                ul.append("<table class='listHeader'><tr><td>First Name</td><td>Last Name</td><td>Priority</td></tr></table>");
            } else if (listName == "opportunityListUL" && deviceType == "desktop") {
                ul.append("<table class='listHeader'><tr><td>Name</td><td>Amount</td><td>Probability</td><td>Priority</td></tr></table>");
            } else if (listName == "opportunityListUL" && deviceType == "tablet") {
                ul.append("<table class='listHeader'><tr><td>Name</td><td>Amount</td><td>Priority</td></tr></table>");
            } else if (listName == "meetingListUL") {
                ul.append("<table class='listHeader'><tr><td>Subject</td><td>Start Date</td><td>Status</td></tr></table>");
            } else if (listName == "callListUL" && deviceType == "tablet") {
                ul.append("<table class='listHeader'><tr><td>Subject</td><td>First Name</td><td>Last Name</td></tr></table>");
            } else if ((listName == "callListULContact" || listName == "callListULLead") && deviceType == "tablet") {
                ul.append("<table class='listHeader'><tr><td>Call Subject</td></tr></table>");
            } else if (listName == "callListUL" && deviceType == "desktop") {
                ul.append("<table class='listHeader'><tr><td>Subject</td><td>Call Date</td><td>First Name</td><td>Last Name</td></tr></table>");
            } else if ((listName == "callListULContact" || listName == "callListULLead") && deviceType == "desktop") {
                ul.append("<table class='listHeader'><tr><td>Subject</td><td>Call Date</td></tr></table>");
            }
        }

        // apply search criterion, if specified.
        var len = items.length;
        for (var i = 0; i < len; i++) {
            var item = items[i];
            // If search criterion is not met, do not add to list
            if (searchField1 && searchValue1 &&
                (item[searchField1].indexOf(searchValue1) <= -1)
            ) {
                continue;
            } else if (searchField1 && searchValue1 && searchField2 && searchValue2 &&
                ((item[searchField1].indexOf(searchValue1) <= -1) || (item[searchField2].indexOf(searchValue2) <= -1))
            ) {
                continue;
            } else if (searchField1 && searchValue1 && searchField2 && searchValue2 && searchField3 && searchValue3 &&
                ((item[searchField1].indexOf(searchValue1) <= -1) || (item[searchField2].indexOf(searchValue2) <= -1) || (item[searchField3].indexOf(searchValue3) <= -1))
            ) {
                continue;
            }
			/*
            if (searchField1 && searchValue1 &&
                item[searchField1] != searchValue1
            ) {
                continue;
            } else if (searchField1 && searchValue1 && searchField2 && searchValue2 &&
                (item[searchField1] != searchValue1 || item[searchField2] != searchValue2)
            ) {
                continue;
            } else if (searchField1 && searchValue1 && searchField2 && searchValue2 && searchField3 && searchValue3 &&
                (item[searchField1] != searchValue1 || item[searchField2] != searchValue2 || item[searchField3] != searchValue3)
            ) {
                continue;
            }
			*/
            // Only display future meetings
            if ((listName == "upcomingMeetingsUL") && (item.start_date < now)) {
                continue;
            }

            // Display only top 4 entries for home page list
            if ((listName == "topLeadsUL" || ul == "upcomingMeetingsUL") && (i > 3)) {
                continue;
            }

            // Do not display closed leads on home page
            if ((listName == "topLeadsUL") && (item.lead_status == "Closed")) {
                continue;
            }


            // Otherwise add to list
            var liText = "";
            if (entityType == "contact") {
                if (deviceType == "desktop") {
                    // liText = item.account_name + " " + item.phone + " " + item.accountEMail;
                    liText = "<table><tr><td>" + item.first_name + "</td><td>" + item.last_name + "</td><td>" + item.phone + "</td><td>" + item.contactEMail + "</td></tr></table>";
                } else if (deviceType == "tablet") {
                    // liText = item.account_name + " " + item.phone + " " + item.accountEMail;
                    liText = "<table><tr><td>" + item.first_name + "</td><td>" + item.last_name + "</td><td>" + item.phone + "</td></tr></table>";
                } else {
                    liText = item.first_name + "  " + item.last_name;
                }
            } else if (entityType == "account") {
                if (deviceType == "desktop") {
                    // liText = item.account_name + " " + item.phone + " " + item.accountEMail;
                    liText = "<table><tr><td>" + item.account_name + "</td><td>" + item.phone + "</td><td>" + item.accountEMail + "</td></tr></table>";
                } else if (deviceType == "tablet") {
                    // liText = item.account_name + " " + item.phone + " " + item.accountEMail;
                    liText = "<table><tr><td>" + item.account_name + "</td><td>" + item.phone + "</td></tr></table>";
                } else {
                    liText = item.account_name;
                }
            } else if (entityType == "opportunity") {
                if (deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.opportunity_name + "</td><td>" + item.amount + "</td><td>" + item.probability + "</td><td>" + item.priority + "</td></tr></table>";
                } else if (deviceType == "tablet") {
                    liText = "<table><tr><td>" + item.opportunity_name + "</td><td>" + item.amount + "</td><td>" + item.priority + "</td></tr></table>";
                } else {
                    liText = item.opportunity_name;
                }
            } else if (entityType == "lead") {
                if (deviceType == "tablet") {
                    liText = "<table><tr><td>" + item.first_name + "</td><td>" + item.last_name + "</td><td>" + item.priority + "</td></tr></table>";
                } else if (deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.company + "</td><td>" + item.first_name + "</td><td>" + item.last_name + "</td><td>" + item.priority + "</td></tr></table>";
                } else {
                    liText = item.first_name + "  " + item.last_name;
                }
            } else if (entityType == "meeting" && listName == "meetingListUL") {
                if (deviceType == "tablet" || deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.subject + "</td><td>" + item.start_date + "</td><td>" + item.meeting_status + "</td></tr></table>";
                } else {
                    liText = item.subject;
                }
            } else if (entityType == "meeting" && listName == "upcomingMeetingsUL") {
                if (deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.subject + "</td><td>" + item.start_date + "</td><td>" + item.meeting_status + "</td></tr></table>";
                } else if (deviceType == "tablet") {
                    liText = "<table><tr><td>" + item.subject + "</td><td>" + item.start_date + "</td></tr></table>";
                } else {
                    liText = item.subject;
                }
            } else if (entityType == "call" && (listName == "callListULContact" || listName == "callListULLead")) {
                if (deviceType == "tablet") {
                    liText = "<table><tr><td>" + item.subject + "</td></tr></table>";
                } else if (deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.subject + "</td><td>" + item.call_date + "</td></tr></table>";
                } else {
                    liText = item.subject;
                }
            } else if (entityType == "call") {
                if (deviceType == "tablet") {
                    liText = "<table><tr><td width='40%'>" + item.subject + "</td><td>" + item.first_name + "</td><td>" + item.last_name + "</td></tr></table>";
                } else if (deviceType == "desktop") {
                    liText = "<table><tr><td>" + item.subject + "</td><td>" + item.call_date + "</td><td>" + item.first_name + "</td><td>" + item.last_name + "</td></tr></table>";
                } else {
                    liText = item.subject;
                }
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

function createOpportunity() {
        var entityType = "opportunity";
        documentId = null;
        $.mobile.changePage(entityType + "Page.html", {
            transition: "none"
        });

        setTimeout(function() {
            document.getElementById(entityType + "EntryForm").reset();

            // Close list view and display data entry form
            $("#" + entityType + "Entry").show("fast");
            $("#" + entityType + "List").hide("fast");
            
            $("#" + entityType + "ListButton").removeClass("disabled");
            $("#" + entityType + "NewButton").addClass("disabled");
            $('body').on('click', 'a.disabled', function(event) {
                event.preventDefault();
            });
            // Disable delete button 
            $("#" + entityType + "DeleteButton").button("disable");
        }, 500);


    }
    // Add an entity

function newItem(entityType) {

        $.mobile.pushStateEnabled = false;
        // Clear entry form and reset documentId.
        documentId = null;
        $.mobile.changePage(entityType + "Page.html", {
            reload: true,
            transition: "none"
        });
        
        setTimeout(function() {}, 500);
        document.getElementById(entityType + "EntryForm").reset();

        // Close list view and display data entry form
        $("#" + entityType + "Entry").show("fast");
        $("#" + entityType + "List").hide("fast");
        
        $("#" + entityType + "ListButton").removeClass("disabled");
        $("#" + entityType + "NewButton").addClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });

        // Disable delete button 
        $("#" + entityType + "DeleteButton").button("disable");
        setTimeout(function() {}, 5000);

    } // End newItem().

// View or edit an entity

function editEntity(entityType, entityId) {
        $.mobile.pushStateEnabled = false;
        var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        var deviceType = "";
        if (width <= 640) {
            deviceType = "phone";
        } else if (width > 1040) {
            deviceType = "desktop";
        } else {
            deviceType = "tablet";
        }
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

        // When a user clicks on a call from the lead entry or contact entry view  
        if (entityType == "call" && $("#contactEntry").is(':visible')) {
            $("#contactEntry").hide();
            $.mobile.changePage("callPage.html", {
                transition: "none"
            });

            setTimeout(function() {
                editCall(entityId);
            }, 500);
            return;


        }
        if (entityType == "call" && $("#leadEntry").is(':visible')) {
            $("#leadEntry").hide();
            $.mobile.changePage("callPage.html", {
                transition: "none"
            });

            setTimeout(function() {
                editCall(entityId);
            }, 500);

            return;

        }
    
        // When user clicks on a top lead or an upcoming meeting from the home page
        if (entityType == "lead" && $("#homePage").is(':visible')) {
            $.mobile.changePage("leadPage.html", {
                transition: "none"
            });

            setTimeout(function() {
                editHomePageEntity(entityType, entityId);
            }, 500);

            return;

        }

        if (entityType == "meeting" && $("#homePage").is(':visible')) {
            $.mobile.changePage("meetingPage.html", {
                transition: "none"
            });

            setTimeout(function() {
                editHomePageEntity(entityType, entityId);
            }, 500);

            return;

        }

        // Close the list view and display entry form
        if (!$("#" + entityType + "Entry").is(':visible')) {
            $("#" + entityType + "Entry").show();
        }
        if ($("#" + entityType + "List").is(':visible')) {
            $("#" + entityType + "List").hide();
        }

        $("#" + entityType + "ListButton").removeClass("disabled");
        $("#" + entityType + "NewButton").addClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });


        // List related calls for contacts and leads

        if (entityType == 'contact' && deviceType != 'phone') {

            var first_name = entity["first_name"];
            var last_name = entity["last_name"];
            var related_to = "Contact";
            updateList('callListULContact', 'call', 'tablet', 'last_name', last_name, 'first_name', first_name, 'related_to', related_to);
        } else if (entityType == 'lead' && deviceType != 'phone') {
            var first_name = entity["first_name"];
            var last_name = entity["last_name"];
            var related_to = "Lead";
            updateList('callListULLead', 'call', 'tablet', 'last_name', last_name, 'first_name', first_name, 'related_to', related_to);
        }

        // Reenable delete button 
        $("#" + entityType + "DeleteButton").button("enable");
        setTimeout(function() {}, 5000);

    } // End editEntity().


// Edit a call from within the lead and contact detail forms

function editCall(entityId) {

        // Save the entity Id
        documentId = entityId;

        // Fetch the entity from local storage
        var entity = JSON.parse(window.localStorage.getItem("call_" + entityId));
        // Loop through the object and populate the form except for the _v and _id fields
        for (field in entity) {
            if (field != "_id" && field != "__v") {
                $("#callEntryForm [name=" + field + "]").val(entity[field]).trigger("change");
            }
        }

        $("#callEntry").show();
        $("#callList").hide();
        
        $("#callListButton").removeClass("disabled");
        $("#callNewButton").addClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });


        // Reenable delete button 
        $("#callDeleteButton").button("enable");

    } // End editCall().

// Edit a lead or meeting from the home page

function editHomePageEntity(entityType, entityId) {

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

        $("#" + entityType + "Entry").show();
        $("#" + entityType + "List").hide();

        $("#" + entityType + "ListButton").removeClass("disabled");
        $("#" + entityType + "NewButton").addClass("disabled");
        $('body').on('click', 'a.disabled', function(event) {
            event.preventDefault();
        });


        // Reenable delete button 
        $("#" + entityType + "DeleteButton").button("enable");
        setTimeout(function() {}, 5000);

    } // End editHomePageEntity().



// Clears all data from the server as well as local storage 
function clearData() {
        // Show waiting message
        $.mobile.loading("show");
        // Make server RESTful call
        $.ajax({
                url: addressAndPort + "/clear"
            })
            .done(function(response) {
                // Now clear localStorage.
                window.localStorage.clear();
                $.mobile.loading("hide");
                $("#infoDialogHeader").html("Success!");
                $("#infoDialogContent").html("Data cleared");
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
            })
            .fail(function(jqXHR, status) {
                // Display error message  
                $.mobile.loading("hide");
                $("#infoDialogHeader").html("Data clear failure");
                $("#infoDialogContent").html("Data not cleared");
                $.mobile.changePage($("#infoDialog"), {
                    role: "dialog"
                });
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
    var priorityMap = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3
    };
    var priorityReverseMap = {
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH"
    };
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
            priority = priorityMap[item.priority];
        var itemdistance = {
            dist: distance,
            prior: priority
        }
        distances.push(itemdistance);

    }

    // sort by distance
    var sorted = distances.sort(function(a, b) {
        if (a.dist < b.dist) return -1;
        if (a.dist > b.dist) return 1;
        return 0;
    });

    // take the first three keys or neighbors
    var priority1 = 0,
        priority2 = 0,
        priority3 = 0;
    for (var i = 0; i < sorted.length; i++) {
        // Only consider 3 nearest neighbors
        if (i > 2) {
            break;
        }
        var item = sorted[i];
        // var prior = Object.keys( sorted[i] )[ 1 ];
        var priority = item["prior"];
        if (priority == 1) {
            priority1++;
        } else if (priority == 2) {
            priority2++;
        } else if (priority == 3) {
            priority3++;
        }
    }

    var maxpriority = Math.max(priority1, priority2, priority3);
    var priorityString = priorityReverseMap[maxpriority];

    // console.log("priority is : " + $("#priority").val());
    $("#priority").val(priorityString);

}

// Score an opportunity
function scoreOpportunity() {
    var distances = [];
    var priorityMap = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3
    };
    var priorityReverseMap = {
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH"
    };
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
            priority = priorityMap[item.priority];
        var itemdistance = {
            dist: distance,
            prior: priority
        }
        distances.push(itemdistance);

    }

    // sort by distance
    var sorted = distances.sort(function(a, b) {
        if (a.dist < b.dist) return -1;
        if (a.dist > b.dist) return 1;
        return 0;
    });

    // var keys = Object.keys(sorted);
    //for (var i = 0, len = sorted.length; i < len; ++i) {
    //    keys[i] = sorted[i].key;
    // }

    // take the first three keys or neighbors
    var priority1 = 0,
        priority2 = 0,
        priority3 = 0;
    for (var i = 0; i < sorted.length; i++) {
        // Only consider 3 nearest neighbors
        if (i > 2) {
            break;
        }
        var item = sorted[i];
        // var prior = Object.keys( sorted[i] )[ 1 ];
        var priority = item["prior"];
        if (priority == 1) {
            priority1++;
        } else if (priority == 2) {
            priority2++;
        } else if (priority == 3) {
            priority3++;
        }
    }

    var maxpriority = Math.max(priority1, priority2, priority3);
    var priorityString = priorityReverseMap[maxpriority];

    // console.log("priority is : " + $("#priority").val());
    $("#priority").val(priorityString);

}