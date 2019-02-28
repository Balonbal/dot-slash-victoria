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