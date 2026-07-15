const {Interests} = require("../model/Bid");
const ReceivingState = require("./ReceivingState");

class Session { //clase que representa una sesión de revisión de papers, con su estado actual y la lógica para avanzar entre estados
    constructor() {
        this._name = "";
        this._programCommittee = [];
        this._papers = [];
        this._bids = [];
        this._state = new ReceivingState(); //estados: arranca la sesión en Recepción
        this._acceptancePolicy = null;
        this._acceptedPapers = [];
    }
    name() {
        return this._name;
    }
    programCommittee() {
        return this._programCommittee;
    }
    reviewers() {
        return this._programCommittee;
    }
    stage() {
        return this._state.stageName();
    }
    setState(state) { //los propios estados establecen aquí la transición al estado siguiente
        this._state = state;
    }
    papers() {
        return this._papers;
    }
    bids() {
        return this._bids;
    }
    addReviewer(user) {
        this._state.addReviewer(this, user);
    }
    canSubmit(paper) {
        return this._state.canSubmit(this, paper);
    }
    submit(paper) {
        this._state.submit(this, paper);
    }
    closeSubmissions() {
        this._state.closeSubmissions(this);
    }
    enterBid(paper, reviewer, interest) {
        this._state.enterBid(this, paper, reviewer, interest);
    }
    bidExistsFor(paper, reviewer) {
        return typeof(this._bidFor(paper, reviewer)) !== "undefined";
    }
    bidFor(paper, reviewer) {
        return this._bidFor(paper, reviewer);
    }
    interestFor(paper, reviewer) {
        return this._bidFor(paper, reviewer).interest();
    }
    closeBidding() {
        this._state.closeBidding(this);
    }
    assignedReviewersFor(paper) {
        return this._state.assignedReviewersFor(this, paper);
    }
    addReview(paper, reviewer, text, score) {
        this._state.addReview(this, paper, reviewer, text, score);
    }
    setAcceptancePolicy(policy) { //se define la política de aceptación de papers viene de un test
        this._acceptancePolicy = policy;
    }
    closeReviewing() {
        this._state.closeReviewing(this);
    }
    acceptedPapers() {
        return this._state.acceptedPapers(this);
    }
    _bidFor(paper, reviewer) {
        return this._bids.find((suspect) => (suspect.paper() === paper) && (suspect.reviewer() === reviewer));
    }
    _bidExistsFor(paper, reviewer) {
        return typeof(this._bidFor(paper, reviewer)) !== "undefined";
    }
    _buildInitialCapacities() { //método para construir un mapa de capacidades iniciales para cada revisor, basado en el número total de papers y revisores
        const reviewers = this._programCommittee;
        const paperCount = this._papers.length;
        const reviewerCount = reviewers.length;
        const total = 3 * paperCount;
        const base = Math.floor(total / reviewerCount);
        const extra = total % reviewerCount;

        const capacities = new Map();
        reviewers.forEach((reviewer, index) => {
            capacities.set(reviewer, base + (index < extra ? 1 : 0));
        });
        return capacities;
    }
    _eligibleReviewersFor(paper, assigned, capacities) { //filtra candidatos elegibles: no asignado aún, con cupo, no autor, sin conflicto de interés
        return this._programCommittee.filter((reviewer) => {
            if (assigned.includes(reviewer)) return false;
            if (capacities.get(reviewer) <= 0) return false;
            if (paper.authors().includes(reviewer)) return false;
            const bid = this._bidFor(paper, reviewer);
            return !(bid && bid.interest() === Interests.Conflict);
        });
    }
    _assignFromPriorityLevel(paper, targetInterest, assigned, capacities) { //asigna revisores elegibles cuyo bid coincide con el nivel de prioridad, priorizando mayor capacidad
        const candidates = this._eligibleReviewersFor(paper, assigned, capacities)
            .filter((reviewer) => {
                const bid = this._bidFor(paper, reviewer);
                return (bid ? bid.interest() : null) === targetInterest;
            })
            .sort((reviewerA, reviewerB) => capacities.get(reviewerB) - capacities.get(reviewerA));
        for (const reviewer of candidates) {
            if (assigned.length >= 3) break;
            assigned.push(reviewer);
            capacities.set(reviewer, capacities.get(reviewer) - 1);
        }
    }
    _assignReviewers() { //orquesta la asignación: por cada paper, recorre los niveles de prioridad hasta completar 3 revisores
        const capacities = this._buildInitialCapacities();
        const priorityOrder = [Interests.Interested, Interests.Maybe, null, Interests.NotInterested];

        for (const paper of this._papers) {
            const assigned = [];
            for (const targetInterest of priorityOrder) {
                if (assigned.length >= 3) break;
                this._assignFromPriorityLevel(paper, targetInterest, assigned, capacities);
            }
            assigned.forEach((reviewer) => { paper.addAssignedReviewer(reviewer); });
        }
    }
}

module.exports = Session;
