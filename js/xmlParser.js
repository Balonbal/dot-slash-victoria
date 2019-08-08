function getXMLElement(filepath , elementName){
  // https://www.w3schools.com/xml/xml_parser.asp
  if(!filepath){
    return "Error, no file";
  }
  if(!ElementName){
    return "Error, no elementName";
  }
  
  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text,"text/xml");
  return xmlDoc.getElementsByTagName(elementName)[0].childNodes[0].nodeValue;
}

function getNode(root, name) {
	if (typeof root[name] == typeof undefined) return false;
	return root[name]["#text"];
}

function getStyle(art) {
	switch (art) {
		case "BREASTSTROKE": return "BR";
		case "FREESTYLE": return "FR";
		case "BUTTERFLY": return "BU";
		case "BACKSTROKE": return "RY";
		case "MEDLEYRELAY": return "LM";
		case "INDIVIDUALMEDLEY": return "IM";
		default: return false;
	}
}

function parseXml(xml, arrayTags)
{
    var dom = null;
    if (window.DOMParser)
    {
        dom = (new DOMParser()).parseFromString(xml, "application/xml");
    }
    else if (window.ActiveXObject)
    {
        dom = new ActiveXObject('Microsoft.XMLDOM');
        dom.async = false;
        if (!dom.loadXML(xml))
        {
            throw dom.parseError.reason + " " + dom.parseError.srcText;
        }
    }
    else
    {
        throw "cannot parse xml string!";
    }

    function isArray(o)
    {
        return Object.prototype.toString.apply(o) === '[object Array]';
    }

    function parseNode(xmlNode, result)
    {
        if (xmlNode.nodeName == "#text") {
            var v = xmlNode.nodeValue;
            if (v.trim()) {
               result['#text'] = v;
            }
            return;
        }

        var jsonNode = {};
        var existing = result[xmlNode.nodeName];
        if(existing)
        {
            if(!isArray(existing))
            {
                result[xmlNode.nodeName] = [existing, jsonNode];
            }
            else
            {
                result[xmlNode.nodeName].push(jsonNode);
            }
        }
        else
        {
            if(arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1)
            {
                result[xmlNode.nodeName] = [jsonNode];
            }
            else
            {
                result[xmlNode.nodeName] = jsonNode;
            }
        }

        if(xmlNode.attributes)
        {
            var length = xmlNode.attributes.length;
            for(var i = 0; i < length; i++)
            {
                var attribute = xmlNode.attributes[i];
                jsonNode[attribute.nodeName] = attribute.nodeValue;
            }
        }

        var length = xmlNode.childNodes.length;
        for(var i = 0; i < length; i++)
        {
            parseNode(xmlNode.childNodes[i], jsonNode);
        }
    }

    var result = {};
    for (let i = 0; i < dom.childNodes.length; i++)
    {
        parseNode(dom.childNodes[i], result);
    }

    return result;
}
