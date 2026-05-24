const {Bid, Interests} = require("./Bid");

class Session{
    constructor(){
        this._name = "";
        this._programCommittee=[];
        this._papers=[];
        this._bids=[];
        this._stage="Receiving";
        this._assignments=new Map();
    }
    name(){
        return this._name;
    };
    programCommittee(){
        return this._programCommittee;
    };
    reviewers(){
        return this._programCommittee;
    };
    addReviewer(user){
        this._programCommittee.push(user);
    }
    canSubmit(paper){
        if (this.stage() == "Receiving" )
            return paper.isValid();
        else 
            return false;
    }
    submit(paper){
        if (!this.canSubmit(paper)) throw new Error("Cannot submit invalid paper");
        
        if (this.stage() == "Receiving" )
            this._papers.push(paper);
        else
            throw new Error("Cannot submit papers at this stage");
    }
    papers(){
        return this._papers;
    }
    bids(){
        return this._bids;
    }
    stage(){
        return this._stage;
    }
    setStage(stage){
        this._stage = stage;
    }
    closeSubmissions(){
        this.setStage("Bidding");
    }
    enterBid(paper, reviewer, interest){
        if (this.stage() == "Bidding" )
            if(this.bidExistsFor(paper, reviewer)){
                let existing =  this.bidFor(paper, reviewer);
                existing.setInterest(interest);
            }
            else{
                let bid = new Bid(paper, reviewer, interest);
                this._bids.push(bid);
            }
        else
            throw new Error("Cannot enter bids from the current stage.");
    }
    bidExistsFor(paper, reviewer){
        return typeof(this.bidFor(paper, reviewer)) != "undefined";
    }
    bidFor(paper, reviewer){
        return this._bids.find( (suspect) => (suspect.paper() == paper) && (suspect.reviewer()==reviewer) );
    }
    interestFor(paper, reviewer){
        return this.bidFor(paper, reviewer).interest();
    }
    closeBidding(){
        this.setStage("Assignment");
        this._assignReviewers();
    }
    _assignReviewers(){
        const papers = this._papers;
        const reviewers = this._programCommittee;
        const A = papers.length;
        const R = reviewers.length;
        const total = 3 * A;
        const base = Math.floor(total / R);
        const extra = total % R;

        const capacities = new Map();
        reviewers.forEach((reviewer, i) => {
            capacities.set(reviewer, base + (i < extra ? 1 : 0));
        });

        const priorityOrder = [Interests.Interested, Interests.Maybe, null, Interests.NotInterested];

        for(const paper of papers){
            const assigned = [];
            for(const targetInterest of priorityOrder){
                if(assigned.length >= 3) break;
                const candidates = reviewers
                    .filter((reviewer) => {
                        if(assigned.includes(reviewer)) return false;
                        if(capacities.get(reviewer) <= 0) return false;
                        if(paper.authors().includes(reviewer)) return false;
                        const bid = this.bidFor(paper, reviewer);
                        if(bid && bid.interest() === Interests.Conflict) return false;
                        return (bid ? bid.interest() : null) === targetInterest;
                    })
                    .sort((a, b) => capacities.get(b) - capacities.get(a));
                for(const reviewer of candidates){
                    if(assigned.length >= 3) break;
                    assigned.push(reviewer);
                    capacities.set(reviewer, capacities.get(reviewer) - 1);
                }
            }
            this._assignments.set(paper, assigned);
        }
    }
    assignedReviewersFor(paper){
        return this._assignments.get(paper) || [];
    }
}

module.exports = Session;