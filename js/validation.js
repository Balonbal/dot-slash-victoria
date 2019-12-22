
function sanitizeName(name){
    // retruns nothing if
    // - input is empty
    // - input contains digits
    // - length of the name is less than 4 characters
    // 
    // Removes:
    // - double whitespaces
    // - whitescpace in front of the name
    // - whitespaces in the end of the name
    // Modifies:
    // - sets capital letter only on first letter and first letter after whitespace

    if(!name){
        return false;
    }

    if(name.length < 4){
        return false;
    }

    // check if name contains digits
    for(i = 0; i < name.length - 1; i++){
        if(Number(name[i])){
            return false;
        }
    }

    // compress multiple spaces into one space
    name = name.replace(/\s+/g, ' ');

    // removed spaces at the start of the name
    if(name[0] == " "){
        name = name.substring(1);
        sanitized = false;
    }
    // removed spaces at the end of the name
    if(name[name.length - 1] == " "){
        name = name.substring(0, name.length - 1);
        sanitized = false;
    }

    name = name.toLowerCase();
    // Set capital letter on first letter
    name = name[0].toUpperCase() + name.substring(1);

    // Set capital letter on first letter after each space or dash
    for(i = 0; i < name.length - 2; i++){
        if(name[i] == " " || name[i] == "-"){
                name = name.substring(0,i) + " " + name[i+1].toUpperCase() + name.substring(i+2);
        }
    }
    return name;
}
function isDiplicate(participants, person){
    if(!participants){
        return;
    }
    if(!person){
        return;
    }
    for (i = 0; i < participants.length - 1; i++){
        if(participants[i].name == person.name && participants[i].birthYear == person.birthYear){
            return true;
        }
    }
    return false;
}


function isValidBirthYear(birthYear){
    // Returns false if age is below 4 year or above 100
    // Returns true otherwise 

    // get current year
    date = new Date;
    currentYear = 2000;
    currentYear += date.getYear();
    // ranges
    const minAge = 4; 
    const maxAge = 100;

    age = currentYear - birthYear;

    if(age > maxAge || age < minAge){
        return false;
    }
    return true;
}
