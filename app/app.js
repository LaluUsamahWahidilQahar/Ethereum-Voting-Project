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
  renderVote: async () => {
    const candidateCount = await App.Voting.candidateCount();
    $("#candidatesResults").empty();
    for (var i = 1; i <= candidateCount; i++) {
      const candidate = await App.Voting.candidates(i);
      const candidateId = candidate[0];
      const candidateName = candidate[1];
      const voteCount = candidate[2];
      var candidateTemplate =
        "<tr><th>" +
        candidateId +
        "</th><td>" +
        candidateName +
        "</td><td>" +
        voteCount +
        "</td></tr>";
      $("#candidatesResults").append(candidateTemplate);
    }

    // Check if user has already voted
    const hasVoted = await App.Voting.voters(App.account);
    if (hasVoted) {
      $("#btnVote").prop("disabled", true);
      $("#voteStatus").html("You have already voted!");
    }
  },

  // Function to cast a vote
  castVote: async () => {
    var candidateId = $("#candidatesSelect").val();
    await App.Voting.vote(candidateId, { from: App.account });
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
