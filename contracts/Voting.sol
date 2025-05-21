// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(address => bool) public voters;
    mapping(uint => Candidate) public candidates;
    uint public candidateCount;

    // Constructor to initialize with two candidates
    constructor() public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    // Function to add a candidate
    function addCandidate(string memory _name) private {
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            voteCount: 0
        });
    }

    // Function for voters to cast their vote
    function vote(uint _candidateId) public {
        require(!voters[msg.sender], "You have already voted.");
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID."
        );
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
    }
}
