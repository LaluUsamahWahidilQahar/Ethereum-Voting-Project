// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
    struct Kandidat {
        uint id;
        string nama;
        uint jumlahVote;
    }
    mapping(address => bool) public paraPemilih;
    mapping(uint => Kandidat) public paraKandidat;
    uint public jumlahKandidat;

    //Constructor to initialize with two candidates
    constructor() public {
        tambahKandidat("Kandidat 1");
        tambahKandidat("Kandidat 2");
    }

    //Function to add a candidate
    function tambahKandidat(string memory _nama) private {
        jumlahKandidat++;
        paraKandidat[jumlahKandidat] = Kandidat({
            id: jumlahKandidat,
            nama: _nama,
            jumlahVote: 0
        });
    } //Function for voters to cast their vote

    function vote(uint _kandidatId) public {
        require(!paraPemilih[msg.sender], "Anda sudah memberikan suara.");
        require(
            _kandidatId > 0 && _kandidatId <= jumlahKandidat,
            "ID kandidat tidak valid."
        );
        paraPemilih[msg.sender] = true;
        paraKandidat[_kandidatId].jumlahVote++;
    }
}
