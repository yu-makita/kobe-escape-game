
// 各場所の情報を管理する
const locations = {
  entrance: {
    name: "玄関",
    description: "出口には電子ロックがかかっています。",
    image: "images/entrance.jpg",
    quizImage: "images/quiz1.png",
    hint: "1桁目は「2」",
    moves: [
      { to: "hallway", label: "廊下へ", pitch: -10, yaw: 0 }
    ],
    hintPosition: { pitch: -5, yaw: 70 }
  },

  hallway: {
    name: "廊下",
    description: "薄暗い廊下が続いています。",
    image: "images/hallway.jpg",
    quizImage: "images/quiz2.png",
    hint: "2桁目は「7」",
    moves: [
      { to: "entrance", label: "玄関へ", pitch: -10, yaw: 180 },
      { to: "classroom", label: "教室へ", pitch: -10, yaw: 45 },
      { to: "stairs", label: "階段へ", pitch: -10, yaw: -60 }
    ],
    hintPosition: { pitch: 5, yaw: 100 }
  },

  classroom: {
    name: "教室",
    description: "机の上に何かが置かれています。",
    image: "images/classroom.jpg",
    hint: "3桁目は「4」",
    moves: [
      { to: "hallway", label: "廊下へ", pitch: -10, yaw: 180 }
    ],
    hintPosition: { pitch: -25, yaw: 20 }
  },

  stairs: {
    name: "階段",
    description: "階段の壁に文字が書かれています。",
    image: "images/stairs.jpg",
    hint: "4桁目は「9」",
    moves: [
      { to: "hallway", label: "廊下へ", pitch: -10, yaw: 180 }
    ],
    hintPosition: { pitch: 0, yaw: 45 }
  }
};

let viewer;
let currentLocation = "entrance";
let collectedHints = [];
let gameCleared = false;

// 各場所の移動ポイントを作成する関数
function createMoveHotspots(location) {
  return location.moves.map(move => ({
    pitch: move.pitch,
    yaw: move.yaw,
    type: "scene",
    sceneId: move.to,
    text: move.label,
    cssClass: "move-hotspot"
  }));
}

// ヒントを取得する関数
function collectHint(locationId) {
  if (gameCleared) return;

  if (collectedHints.includes(locationId)) {
    showMessage("このヒントはすでに入手しています。");
    return;
  }

  collectedHints.push(locationId);

  const location = locations[locationId];

  const item = document.createElement("li");
  item.textContent = `${location.name}：${location.hint}`;

  document.getElementById("hint-list").appendChild(item);

  document.getElementById("progress").textContent =
    `ヒント ${collectedHints.length} / 4`;

  showMessage(`ヒント発見！ ${location.hint}`);

  // 入手済みのヒントを写真から消す
  viewer.removeHotSpot(`hint-${locationId}`, locationId);
}

// 謎解き画像をポップアップ表示する関数
function openQuiz(locationId) {
  const quizImage = locations[locationId].quizImage;

  if (!quizImage) {
    showMessage("ここには謎解き画像がありません。");
    return;
  }

  const modal = document.getElementById("quiz-modal");
  const image = document.getElementById("quiz-image");

  image.src = quizImage;
  image.alt = `${locations[locationId].name}の謎解き問題`;

  modal.classList.remove("hidden");
}

// 謎解き画像を閉じる関数
function closeQuiz() {
  document.getElementById("quiz-modal").classList.add("hidden");
}

// 各場所のヒントポイントを作成する関数
function createHintHotspot(locationId) {
  const location = locations[locationId];

  return {
    id: `hint-${locationId}`,
    pitch: location.hintPosition.pitch,
    yaw: location.hintPosition.yaw,
    cssClass: "hint-hotspot",

    createTooltipFunc: function(element) {
      element.title = "調べる";
    },

    clickHandlerFunc: function() {
      // 謎解き画像がある場所では画像を表示する
      if (location.quizImage) {
        openQuiz(locationId);
      } else {
        // 謎解き画像がない場所では従来のヒントを取得する
        collectHint(locationId);
      }
    }
  };
}

// Pannellum用のシーン設定を作成する関数
function createScenes() {
  const scenes = {};

  for (const [id, location] of Object.entries(locations)) {
    scenes[id] = {
      type: "equirectangular",
      panorama: location.image,
      title: location.name,
      pitch: 0,
      yaw: 0,
      hfov: 100,
      hotSpots: [
        ...createMoveHotspots(location),
        createHintHotspot(id)
      ]
    };
  }

  return scenes;
}

// 現在の場所に応じて画面情報を更新する関数
function updateLocation(locationId) {
  currentLocation = locationId;

  const location = locations[locationId];

  document.getElementById("location-name").textContent =
    location.name;

  document.getElementById("description").textContent =
    location.description;

  document.getElementById("lock-panel").classList.toggle(
    "hidden",
    locationId !== "entrance" || gameCleared
  );

  showMessage("");
}

// メッセージを表示する関数
function showMessage(text) {
  document.getElementById("message").textContent = text;
}

// 暗証番号を判定する関数
function checkPassword() {
  if (gameCleared) return;

  const input = document.getElementById("password").value;

  if (input === "2749") {
    gameCleared = true;

    document.getElementById("lock-panel").classList.add("hidden");

    showMessage("脱出成功！ おめでとうございます！");
  } else {
    showMessage("暗証番号が違います。");
  }
}

// 謎解きポップアップの操作を設定する関数
function setupQuizModal() {
  const modal = document.getElementById("quiz-modal");
  const closeButton = document.getElementById("quiz-close");

  // 閉じるボタンを押したら閉じる
  closeButton.addEventListener("click", closeQuiz);

  // ポップアップの背景をクリックしたら閉じる
  modal.addEventListener("click", function(event) {
    if (event.target === modal) {
      closeQuiz();
    }
  });

  // Escapeキーでも閉じられるようにする
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      closeQuiz();
    }
  });
}

// ゲームを初期化する関数
function initializeGame() {
  viewer = pannellum.viewer("panorama", {
    default: {
      firstScene: "entrance",
      autoLoad: true,
      sceneFadeDuration: 600,
      showControls: true,
      hotSpotDebug: true
    },
    scenes: createScenes()
  });

  // 場所が切り替わったときに画面を更新する
  viewer.on("scenechange", function(sceneId) {
    updateLocation(sceneId);
  });

  // 暗証番号の解除ボタンを設定する
  document.getElementById("unlock-btn")
    .addEventListener("click", checkPassword);

  // 謎解きポップアップの操作を設定する
  setupQuizModal();

  // 最初の場所を表示する
  updateLocation("entrance");
}

initializeGame();
