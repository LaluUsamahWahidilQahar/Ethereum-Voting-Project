App = {
  loading: false,
  web3Provider: null,
  contracts: {},
  account: null,

  load: async () => {
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.error("No web3 provider detected. Please install MetaMask.");
    }
  },

  loadAccount: async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    App.account = accounts[0];
  },

  loadContract: async () => {
    const votingJson = await $.getJSON("Voting.json");
    App.contracts.Voting = TruffleContract(votingJson);
    App.contracts.Voting.setProvider(App.web3Provider);
    App.Voting = await App.contracts.Voting.deployed();
  },

  render: async () => {
    if (App.loading) {
      return;
    }
    App.setLoading(true);
    $("#accountAddress").html("Account Address: " + App.account);
    await App.renderVote();
    App.setLoading(false);
  },

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

  renderVote: async () => {
    const jumlahKandidat = await App.Voting.jumlahKandidat();
    $("#candidatesResults").empty();
    for (var i = 1; i <= jumlahKandidat; i++) {
      const kandidat = await App.Voting.paraKandidat(i);
      const kandidatid = kandidat[0];
      const kandidatNama = kandidat[1];
      const kandidatJumlahVote = kandidat[2];
      var candidateTemplate =
        "<tr><th>" +
        kandidatid +
        "</th><td>" +
        kandidatNama +
        "</td><td>" +
        kandidatJumlahVote +
        "</td></tr>";
      $("#candidatesResults").append(candidateTemplate);
    }

    const isVote = await App.Voting.paraPemilih(App.account);
    if (isVote) {
      $("#btnVote").prop("disabled", true);
      $("#voteStatus").html("Anda sudah memberikan Voting!");
    }
  },

  castVote: async () => {
    var kandidatid = $("#candidatesSelect").val();
    await App.Voting.vote(kandidatid, { from: App.account });
    window.location.reload();
  },
};

$(document).ready(function () {
  App.load();
  ethereum.on("accountsChanged", function (accounts) {
    App.account = accounts[0];
    window.location.reload();
  });
});
