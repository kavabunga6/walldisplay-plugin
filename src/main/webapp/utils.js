
function plural(text, count) {
    if (count == 0)
    {
        return "";
    }
    else
    {
        return count + " " + ((count > 1) ? text + "s" : text);
    }
}

function getJobByName(jobs, jobName)
{
    return $.grep(jobs, function(job, i) {
            return ( job.name == jobName);
    });
}

function getUserFriendlyTimespan(milliseconds) {

    var time = milliseconds / 1000;
    var seconds = Math.floor(time % 60);

    time /= 60;    
    var minutes = Math.floor(time % 60);
    
    time /= 60;
    var hours = Math.floor(time % 24);
    
    time /= 24;
    var days = Math.floor(time);

    time /= 30;
    var months = Math.floor(time);

    if (months > 0)
    {
        return plural("month", months) +  " " + plural("day", days);
    }

    if (days > 0)
    {
        return plural("day", days) +  " " + plural("hour", hours);
    }

    if (hours > 0)
    {
        return plural("hour", hours) + " " + plural("minute", minutes);
    }

    if (minutes > 0)
    {
        return plural("minute", minutes) + " " + plural("second", seconds);
    }

    return seconds + " seconds";
}

jQuery.fn.center = function () {

    this.css("position", "absolute");
    this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
    this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");

    return this;
};

function getParameterByName(name, defaultValue)
{
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if(results == null)
        return defaultValue;
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

Array.prototype.remove = function (value)
{
    for (var i = 0; i < this.length; )
    {
        if (this[i] === value)
        {
            this.splice(i, 1);
        }
        else
        {
            ++i;
        }
    }
};

function removeMessage()
{
    $("#Message").remove();
};

function getLongestJob(jobs, showBuildNumber, showLastStableTimeAgo, showDetails, showJunitResults) {

    var job = null;

    $.each(jobs, function(index, currentJob) { 
        if (job == null || getJobText(currentJob, showBuildNumber, showLastStableTimeAgo, showDetails, showJunitResults).length > getJobText(job, showBuildNumber, showLastStableTimeAgo, showDetails, showJunitResults).length)
        {
            job = currentJob;
        }
    });

    return job;
}

function getJobTitle(job, showBuildNumber) {

    var jobTitle = job.displayName;

    if (job.property != null) {
        $.each(job.property, function(index, property) {
            if (property.wallDisplayName != null)
            {
                jobTitle = property.wallDisplayName;
                return false;
            }
        });
    }
    
    return jobTitle += "<small>" + getJobBuildNumber(job, showBuildNumber) + " (" +  getJobProperty(job) + ")</small>";
}

function getJobProperty(job) {
	
	var jobProperty = "";
	
	 if (job.lastBuild != null && job.lastBuild.actions != null) {
        $.each(job.lastBuild.actions, function(index, action) {
            var params = action.lastBuiltRevision;
            if(params != null) {
				jobProperty = params.branch[0].name.replace(new RegExp(".*/",''), '');
				return false;
			}
        });
    }
    
    return jobProperty;
}

function getJobBuildNumber(job, showBuildNumber) {
	
	var jobBuildNumber = "";
	
	if (showBuildNumber && job.lastBuild != null && job.lastBuild.number != null) {
        jobBuildNumber += '<br> #' + job.lastBuild.number;
    }
    
    return jobBuildNumber;
}

function getJobFailureCause(job) {
    
    var failureCause = '';
    
   if (job.lastBuild != null && job.lastBuild.actions != null) {
           $.each(job.lastBuild.actions, function(index, action) {
               var failureCauses = action.foundFailureCauses;
               if (failureCauses !== undefined) {
                   $.each(failureCauses, function(index, cause) {
                       if (cause.description !== undefined && cause.description !== "Tests failed!") {
                           failureCause = "<small>(" + cause.description + ")</small>";
                           return false;
                       }
                   });
               }
           });
       }

    return failureCause;
}

//String format from: http://jsfiddle.net/joquery/9KYaQ/
String.format = function() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];
    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }
    return theString;
}

function getJunitResults(job)
{
  lastBuild = job.lastBuild
  jobActions = lastBuild.actions
  appendText=""
  $.each(jobActions, function(actionIndex, action){
    if(action && action.totalCount){
      template = "<br/><small>{0} tests, {2} failed</small>"
      formatedLine = String.format(template,action.totalCount, (action.totalCount > 1) ? "s" : "", action.failCount, (action.failCount > 1) ? "s" : "")
      appendText += formatedLine
    }
  });

  //junitResults = jobActions.hudson.tasks.junit.TestResultAction
  return appendText 
}

function getJobText(job, showBuildNumber, showLastStableTimeAgo, showDetails, showJunitResults) {

    var jobText = getJobTitle(job, showBuildNumber);

    if (showJunitResults && getJobFailureCause(job) == '') {
        jobText += getJunitResults(job) ;
    }else if (showJunitResults && getJobFailureCause(job) !== ''){
		jobText += getJobFailureCause(job) ;
	} else if (!showJunitResults && getJobFailureCause(job) !== ''){
	    jobText += getJobFailureCause(job);	
	}
	
    var appendText = new Array();

    if (showDetails) {
        var culprit = getCulprit(job);
        var claimer = getClaimer(job);
        if (showLastStableTimeAgo && job.lastBuild != null && job.lastBuild.timestamp != null) {
                appendText.push($.timeago(job.lastBuild.timestamp));
                appendText.push(culprit.fullName);
            }
        
        if(appendText.length > 0) {
            jobText += "<br/><small>" + appendText.join("<br>") + "</small>";
        };
    }

    return jobText;
}

function getGravatarUrl(job, showGravatar, size, gravatarUrl) {
    if(showGravatar && getEmail(job) !== "") {
        var hash = CryptoJS.MD5(getEmail(job).toLowerCase());

        return (gravatarUrl != null && gravatarUrl != "" ? gravatarUrl : "http://www.gravatar.com/avatar/") + hash + "?s=" + size;
    }
}
function getEmail(job) {
    var email = "";

    if(job.lastBuild != null && job.lastBuild.culprits != null && job.lastBuild.culprits != "") {
       for(i in job.lastBuild.culprits[0].property) {
          email = job.lastBuild.culprits[0].property[i].address || email;
       }
    }

    return email;
}

function getCulprit(job) {
    var culprit = "";

    if(job.lastBuild != null && job.lastBuild.culprits != null && job.lastBuild.culprits != "") {
        culprit = job.lastBuild.culprits[0];
    }

    return culprit;
}

function getClaimer(job) {
    var claimer = "";

    var build = isJobBuilding(job) ? job.lastCompletedBuild : job.lastBuild;
    
    if (build && build.actions)     
        $.each(build.actions, function(actionIndex, action){
    
            if(action && action.claimed){
                claimer = action.claimedBy;
            }
        });
    return claimer;
}

function isBuildClaimed(job) {
    return getClaimer(job) != "";
}

function trim(str) {
    return str.replace(/^\s+|\s+$/g,'');
}
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
