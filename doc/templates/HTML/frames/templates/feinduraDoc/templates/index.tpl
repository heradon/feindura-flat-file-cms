<?xml version="1.0" encoding="iso-8859-1"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//FR"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<!-- Generated by phpDocumentor on {$date}  -->
  <title>{$title}</title>
  <meta http-equiv='Content-Type' content='text/html; charset=iso-8859-1'/>
  
  {literal}
  <script language="JavaScript">
  /* <![CDATA[ */    
    var framesetLoaded = true;
    
    function str_replace(search, replace, subject) {
      var result = "";
      var  oldi = 0;
      for (i = subject.indexOf (search)
         ; i > -1
         ; i = subject.indexOf (search, i))
      {
        result += subject.substring (oldi, i);
        result += replace;
        i += search.length;
        oldi = i;
      }
      return result + subject.substring (oldi, subject.length);
    }
    
    function loadPage() {
      if(self.location.search.length > 0) {
        // get the url from the [implementation]/...
        var new_url = self.location.href;
        var current_package;
        
        if(new_url.indexOf('%5B') > 0) {
          new_url = new_url.substring(new_url.indexOf('%5B'));
          current_package = new_url.substring(new_url.indexOf('%5B'),new_url.lastIndexOf('%5D'));
          current_package = 'li_['+current_package.substring(3)+'].html';
          current_package = str_replace('%5B', '[', current_package);
          current_package = str_replace('%5D', ']', current_package);
        } else if(new_url.indexOf('[') > 0) {
          new_url = new_url.substring(new_url.indexOf('['));
          current_package = new_url.substring(new_url.indexOf('['),new_url.lastIndexOf(']'));
          current_package = 'li_['+current_package.substring(1)+'].html';
        } else {
          return false;
        }
        
        //alert(new_url);
        //alert(current_package);
        
        if(document.images) {
          self.right.location.replace(new_url);
          self.left_bottom.location.replace(current_package);
          self.left_top.location.replace('packages.html?'+current_package);
        } else {
          self.right.location.href = new_url;
          self.left_bottom.location.href = current_package;
          self.left_top.location.href = 'packages.html?'+current_package;
        }
        return false;
      }
    }

  /* ]]> */
  </script>
  {/literal}
</head>

<frameset rows='123,*' border="0" onLoad="loadPage(); return true;"><!-- onLoad="loadPage(); return true;" -->
	<frame src='packages.html' name='left_top' frameborder="0">
	<frameset cols='251,*'>
		<frame src='{$start}' name='left_bottom' frameborder="0">
		<frame src='{$blank}.html' name='right' frameborder="0">
	</frameset>
	<noframes>
		<h2>Frame Error</h2>
		<p>This document is designed to be viewed using frames.
		If you see this message, you are using a non-frame-capable web client.</p>
	</noframes>
</frameset>

</html>