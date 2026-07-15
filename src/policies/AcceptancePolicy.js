class AcceptancePolicy { //clase base para las politicas de aceptacion
    select(papers) {
        throw new Error("Subclass must implement select()");
    }
}

module.exports = AcceptancePolicy;