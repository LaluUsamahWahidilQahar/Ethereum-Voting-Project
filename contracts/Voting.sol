// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        bool exists;
    }

    mapping(address => bool) public voters; // status voting tiap address
    address[] public voterList; // daftar voter untuk reset
    mapping(uint => Candidate) public candidates;
    uint public candidateCount;
    address public owner;

    constructor() {
        owner = msg.sender;
        _addCandidate("Candidate 1");
        _addCandidate("Candidate 2");
        _addCandidate("Candidate 3");
    }

    // hanya untuk internal
    function _addCandidate(string memory _name) internal {
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            voteCount: 0,
            exists: true
        });
        _resetVoters();
        _resetVotes();
    }

    function createCandidate(string memory _name) public {
        require(msg.sender == owner, "Only owner can add candidates");
        _addCandidate(_name);
    }

    function deleteCandidate(uint _candidateId) public {
        require(msg.sender == owner, "Only owner can delete candidates");
        require(candidates[_candidateId].exists, "Candidate does not exist");

        // swap and pop
        if (_candidateId != candidateCount) {
            candidates[_candidateId] = candidates[candidateCount];
            candidates[_candidateId].id = _candidateId;
        }

        delete candidates[candidateCount];
        candidateCount--;

        if (_candidateId <= candidateCount) {
            candidates[_candidateId].exists = true;
        }

        _resetVoters();
        _resetVotes();
    }

    function vote(uint _candidateId) public {
        require(!voters[msg.sender], "You have already voted.");
        require(candidates[_candidateId].exists, "Candidate does not exist");

        voters[msg.sender] = true;
        voterList.push(msg.sender); // catat voter
        candidates[_candidateId].voteCount++;
    }

    // Reset semua voter menjadi belum vote
    function _resetVoters() internal {
        for (uint i = 0; i < voterList.length; i++) {
            voters[voterList[i]] = false;
        }
        delete voterList; // kosongkan daftar voter
    }

    // Reset voteCount semua kandidat
    function _resetVotes() internal {
        for (uint i = 1; i <= candidateCount; i++) {
            if(candidates[i].exists){
                candidates[i].voteCount = 0;
            }
        }
    }
}
