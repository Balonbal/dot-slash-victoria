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

    // check if name contains digits
    for(let i = 0; i < name.length - 1; i++){

        if(Number(name[i])){
            return false;
        }
    }

    name = name.toLowerCase();
    // Set capital letter on first letter
    name = name[0].toUpperCase() + name.substring(1);

    // Set capital letter on first letter after each space or dash
    for(let i = 0; i < name.length - 2; i++){
        if(name[i] == " "){
                name = name.substring(0,i) + " " + name[i+1].toUpperCase() + name.substring(i+2);
        }
        if(name[i] == "-"){
            name = name.substring(0,i) + "-" + name[i+1].toUpperCase() + name.substring(i+2);
        }
    }
    return name;
}
function isDuplicate(participants, person){
    if(!participants){
        return;
    }
    if(!person){
        return;
    }
    for (let i = 0; i < participants.length - 1; i++){
        if(participants[i].name == person.name && participants[i].birthYear == person.birthYear){
            return true;
        }
    }
    return false;
}

function isValidBirthYear(birthYear){
    // Returns false if age is below 4 year or above 100
    // Returns true otherwise
    const minAge = 4;
    const maxAge = 100;

    // get current year
    date = new Date;
    currentYear = 1900;
    currentYear += date.getYear(); // getYear() returns 120 in 2020 because 99 is 1999, 100 is 2000 and 2010 is 110.

    if(birthYear < 100 && birthYear > 10){
        // birthYear is in two digit format

        // if adding 2000 to birthYear is above current year then it is not valid. Add 1900 in stead
        if(currentYear < 2000 + birthYear){
            birthYear = birthYear += 1900;
        }else{
            birthYear = birthYear += 2000;
        }

        age = currentYear - birthYear;

        if(age > maxAge || age < minAge){
            return false;
        }
        return true;

    }else if(birthYear < 10000 && birthYear > 999){
        // birthYear is in four digit format

        age = currentYear - birthYear;

        if(age > maxAge || age < minAge){
            return false;
        }
        return true;

    }else{
        // input is not in four or two digit format. format is invalid.
        return false;
    }
}