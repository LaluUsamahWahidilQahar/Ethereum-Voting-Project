// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    uint public pollsCount = 0;

    struct Option {
        string option;
        uint votes;
    }

    struct Poll {
        uint id;
        address creator;
        string question;
        bool finalized;
    }

    // Storage
    mapping(uint => Poll) public pollIdToPoll;
    mapping(uint => Option[]) public pollIdToOptions;
    mapping(address => mapping(uint => bool)) public hasVotedOnPoll;

    // Events
    event PollCreated(
        uint id,
        address creator,
        string question,
        string[] options
    );
    event PollVoted(uint id, address voter, uint optionIndex);
    event PollDeleted(uint id);
    event PollFinalized(uint id);

    function pollCount() external view returns (uint) {
        return pollsCount;
    }

    function createPoll(
        string memory _question,
        string[] memory _options
    ) public {
        require(bytes(_question).length > 0, "Question required");
        require(_options.length > 1, "Need at least 2 options");

        pollsCount++;
        Poll memory _poll = Poll({
            id: pollsCount,
            creator: msg.sender,
            question: _question,
            finalized: false
        });
        pollIdToPoll[pollsCount] = _poll;

        for (uint i = 0; i < _options.length; i++) {
            pollIdToOptions[pollsCount].push(
                Option({option: _options[i], votes: 0})
            );
        }

        emit PollCreated(pollsCount, msg.sender, _question, _options);
    }

    function vote(uint _pollId, uint _optionIndex) public {
        require(_pollId != 0 && _pollId <= pollsCount, "Poll does not exist");
        Poll storage p = pollIdToPoll[_pollId];

        require(!p.finalized, "Poll already finalized");
        require(
            _optionIndex < pollIdToOptions[_pollId].length,
            "Invalid option"
        );
        require(!hasVotedOnPoll[msg.sender][_pollId], "Already voted");

        pollIdToOptions[_pollId][_optionIndex].votes += 1;
        hasVotedOnPoll[msg.sender][_pollId] = true;

        emit PollVoted(_pollId, msg.sender, _optionIndex);
    }

    function finalizePoll(uint _pollId) external {
        require(_pollId != 0 && _pollId <= pollsCount, "Poll does not exist");
        Poll storage p = pollIdToPoll[_pollId];
        require(p.creator == msg.sender, "Only creator can finalize");
        require(!p.finalized, "Already finalized");

        p.finalized = true;
        emit PollFinalized(_pollId);
    }

    function getPoll(
        uint _pollId
    )
        external
        view
        returns (
            string memory question,
            string[] memory options,
            uint[] memory votes,
            bool finalized
        )
    {
        require(_pollId != 0 && _pollId <= pollsCount, "Poll does not exist");

        Poll storage poll = pollIdToPoll[_pollId];
        uint optionCount = pollIdToOptions[_pollId].length;

        string[] memory optionTexts = new string[](optionCount);
        uint[] memory optionVotes = new uint[](optionCount);

        for (uint i = 0; i < optionCount; i++) {
            optionTexts[i] = pollIdToOptions[_pollId][i].option;
            optionVotes[i] = pollIdToOptions[_pollId][i].votes;
        }

        return (poll.question, optionTexts, optionVotes, poll.finalized);
    }

    function getPollMeta(
        uint _pollId
    ) external view returns (address creator, bool finalized) {
        require(_pollId != 0 && _pollId <= pollsCount, "Poll does not exist");
        Poll storage poll = pollIdToPoll[_pollId];
        return (poll.creator, poll.finalized);
    }

    function hasVoted(address user, uint _pollId) external view returns (bool) {
        return hasVotedOnPoll[user][_pollId];
    }

    function deletePoll(uint _pollId) external {
        require(_pollId != 0 && _pollId <= pollsCount, "Poll does not exist");
        require(pollIdToPoll[_pollId].creator == msg.sender, "Only creator can delete");

        uint lastId = pollsCount;

        if (_pollId != lastId) {
            // copy data poll terakhir ke posisi _pollId
            pollIdToPoll[_pollId] = pollIdToPoll[lastId];
            pollIdToOptions[_pollId] = pollIdToOptions[lastId];

            // update id agar konsisten
            pollIdToPoll[_pollId].id = _pollId;
        }

        // hapus data terakhir
        delete pollIdToPoll[lastId];
        delete pollIdToOptions[lastId];

        pollsCount--;

        emit PollDeleted(_pollId);
    }
}
