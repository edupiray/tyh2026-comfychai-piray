

class User{ //clase que representa un usuario, con su nombre completo, afiliación, email y contraseña encriptada
    constructor(fullName, affiliation, email, password){
        let crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        this.fullName = fullName;
        this.affiliation = affiliation;
        this.email = email;
        this.encryptedPassword = hash.update(password).digest('base64');
    }

    getEncryptedPassword(){
        return this.encryptedPassword;
    }
}

module.exports = User;