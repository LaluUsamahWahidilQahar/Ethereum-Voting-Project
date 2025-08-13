App = {
  loading: false,
  web3Provider: null,
  contracts: {},
  account: null,

  // Load the application
  load: async () => {
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },

  // Connect to Web3
  loadWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable(); // Request access to MetaMask
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.error("No web3 provider detected. Please install MetaMask.");
    }
  },

  // Load the user's Ethereum account
  loadAccount: async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    App.account = accounts[0];
  },

  // Load the smart contract
  loadContract: async () => {
    const votingJson = await $.getJSON("Voting.json");
    App.contracts.Voting = TruffleContract(votingJson);
    App.contracts.Voting.setProvider(App.web3Provider);
    App.Voting = await App.contracts.Voting.deployed();
  },

  // Render the UI
  render: async () => {
    if (App.loading) return;
    App.setLoading(true);
    $("#accountAddress").html("Account Address: " + App.account);
    await App.renderVote();
    App.setLoading(false);
  },

  // Toggle loading spinner
  setLoading: (bool) => {
    App.loading = bool;
    const loader = $("#loader");
    const content = $("#content");
    if (bool) {
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.show();
    }
  },

  // Render voting results
  // Render voting results
  renderVote: async () => {
    const candidateCount = await App.Voting.candidateCount();
    $("#candidatesResults").empty();
    $("#candidatesSelect").empty(); // kosongkan pilihan di dropdown

    for (var i = 1; i <= candidateCount; i++) {
      const candidate = await App.Voting.candidates(i);
      const candidateId = candidate[0].toNumber();
      const candidateName = candidate[1];
      const voteCount = candidate[2].toNumber();

      // Tampilkan di tabel
      var candidateTemplate =
        "<tr><th>" +
        candidateId +
        "</th><td>" +
        candidateName +
        "</td><td>" +
        voteCount +
        "</td></tr>";
      $("#candidatesResults").append(candidateTemplate);

      // Tambahkan ke dropdown
      $("#candidatesSelect").append(
        `<option value="${candidateId}">${candidateName}</option>`
      );
      $("#candidatesDelete").append(
        `<option value="${candidateId}">${candidateName}</option>`
      );
    }

    // Cek apakah user sudah vote
    const hasVoted = await App.Voting.voters(App.account);
    if (hasVoted) {
      $("#btnVote").prop("disabled", true);
      $("#voteStatus").html("You have already voted!");
    }
  },


renderCandidatesForInisiator: async () => {
  const candidateCount = await App.Voting.candidateCount();
  $("#candidatesInisiator").empty();
  $("#candidatesDelete").empty();

  for (let i = 1; i <= candidateCount; i++) {
    const candidate = await App.Voting.candidates(i);
    if (!candidate.exists) continue; // skip kandidat yang dihapus

    const candidateId = candidate.id.toNumber();
    const candidateName = candidate.name;
    const voteCount = candidate.voteCount.toNumber();

    const candidateTemplate = `<tr><th>${candidateId}</th><td>${candidateName}</td><td>${voteCount}</td></tr>`;
    $("#candidatesInisiator").append(candidateTemplate);

    $("#candidatesDelete").append(`<option value="${candidateId}">${candidateName}</option>`);
  }
},



  // Function to cast a vote
  castVote: async () => {
    var candidateId = $("#candidatesSelect").val();
    await App.Voting.vote(candidateId, { from: App.account });
    window.location.reload();
  },

  // Function to add a new candidate (owner only)
  addNewCandidate: async () => {
    const name = $("#newCandidateName").val();
    if (!name) {
      alert("Please enter a candidate name");
      return;
    }
    await App.Voting.createCandidate(name, { from: App.account });
    window.location.reload();
  },

  // Function to delete candidate by ID (owner only)
  deleteCandidateById: async () => {
    var candidateId = $("#candidatesDelete").val();
    await App.Voting.deleteCandidate(candidateId, { from: App.account });
    window.location.reload();
  },

  // Function to delete candidate by Name (owner only)
  deleteCandidateByName: async () => {
    const name = $("#deleteCandidateName").val();
    if (!name) {
      alert("Please enter candidate name");
      return;
    }
    await App.Voting.deleteCandidateByName(name, { from: App.account });
    window.location.reload();
  },
};



// Initialize the app when the page is ready
$(document).ready(function () {
  App.load();
  ethereum.on("accountsChanged", function (accounts) {
    App.account = accounts[0];
    window.location.reload();
  });
});
