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
    if (App.loading) return;
    App.setLoading(true);

    $("#accountAddress").html("Account Address: " + App.account);

    if ($("#myPolls").length) {
      await App.renderMyPolls();
    } else if ($("#pollsList").length) {
      await App.renderPolls();
    }

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

  renderPolls: async () => {
    const pollCount = await App.Voting.pollCount();
    $("#pollsList").empty();

    for (let i = 1; i <= pollCount.toNumber(); i++) {
      const pollData = await App.Voting.getPoll(i);
      const pollMeta = await App.Voting.getPollMeta(i);

      const question = pollData[0];
      const options = pollData[1];
      const votes = pollData[2];
      const finalized = pollData[3];
      const creator = pollMeta[0];

      if (!question || creator === "0x0000000000000000000000000000000000000000") {
        continue;
      }

      const alreadyVoted = await App.Voting.hasVoted(App.account, i);

      let optionsHtml = "";
      for (let j = 0; j < options.length; j++) {
        optionsHtml += `
        <div>
          <input type="radio" name="poll_${i}" value="${j}" 
            ${finalized || alreadyVoted ? "disabled" : ""}>
          ${options[j]} (${votes[j].toNumber()} votes)
        </div>
      `;
      }

      const pollTemplate = `
      <div class="poll-card">
        <h3>${question}</h3>
        <p><b>Creator:</b> ${creator}</p>
        <p><b>Status:</b> ${finalized ? "Finalized" : "Active"}</p>
        ${optionsHtml}
        ${finalized
          ? "<p><i>Poll closed</i></p>"
          : alreadyVoted
            ? "<p><i>You already voted in this poll</i></p>"
            : `<button class="btn btn-success" onclick="App.castVote(${i})">Vote</button>`
        }
      </div>
    `;

      $("#pollsList").append(pollTemplate);
    }
  },


  renderMyPolls: async () => {
    const pollCount = await App.Voting.pollCount();
    $("#myPolls").empty();

    for (let i = 1; i <= pollCount.toNumber(); i++) {
      const pollData = await App.Voting.getPoll(i);
      const pollMeta = await App.Voting.getPollMeta(i);

      const creator = pollMeta[0];
      if (creator.toLowerCase() !== App.account.toLowerCase()) continue;

      const question = pollData[0];
      const options = pollData[1];
      const votes = pollData[2];
      const finalized = pollData[3];

      let optionsHtml = "";
      for (let j = 0; j < options.length; j++) {
        optionsHtml += `
          <div>
            ${options[j]} (${votes[j].toNumber()} votes)
          </div>
        `;
      }

      let actionButtons = `<button class="btn btn-danger" onclick="App.deletePoll(${i})">Delete</button>`;
      if (!finalized) {
        actionButtons += ` <button class="btn btn-primary" onclick="App.finalizePoll(${i})">Finalize</button>`;
      }


      const pollTemplate = `
        <div class="poll-card">
          <h3>${question}</h3>
          <p><b>Status:</b> ${finalized ? "Finalized" : "Active"}</p>
          ${optionsHtml}
          ${actionButtons}
        </div>
      `;

      $("#myPolls").append(pollTemplate);
    }
  },

  createPoll: async () => {
    const question = $("#pollQuestion").val();
    const optionsRaw = $("#pollOptions").val();

    if (!question || !optionsRaw) {
      alert("Please fill in question and options");
      return;
    }

    const options = optionsRaw.split(",").map((opt) => opt.trim()).filter(opt => opt.length > 0);

    if (options.length < 2) {
      alert("Please enter at least 2 options");
      return;
    }

    try {
      await App.Voting.createPoll(question, options, { from: App.account });
      alert("Poll created successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to create poll: " + error.message);
    }
  },

  deletePoll: async (pollId) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    try {
      await App.Voting.deletePoll(pollId, { from: App.account });
      alert("Poll deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to delete poll: " + error.message);
    }
  },

  finalizePoll: async (pollId) => {
    try {
      await App.Voting.finalizePoll(pollId, { from: App.account });
      alert("Poll finalized successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to finalize poll: " + error.message);
    }
  },

  castVote: async (pollId) => {
    const option = $(`input[name=poll_${pollId}]:checked`).val();
    if (option === undefined) {
      alert("Please select an option");
      return;
    }

    const optionIndex = parseInt(option);

    await App.Voting.vote(pollId, optionIndex, { from: App.account });
    window.location.reload();
  }
};

$(document).ready(function () {
  App.load();
  ethereum.on("accountsChanged", function (accounts) {
    App.account = accounts[0];
    window.location.reload();
  });
});
