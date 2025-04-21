document.addEventListener("DOMContentLoaded", function () {
  // 确保浮窗工具已加载
  if (
    !window.diagramRenderUtils ||
    !window.diagramRenderUtils.popupWindowUtils
  ) {
    console.error(
      "浮窗工具未加载，请确保diagram_render_utils.html已包含在页面中"
    );
    return;
  }

  // 创建一个存储笔记的对象，使用localStorage保存笔记
  const noteStorage = {
    // 获取当前页面的唯一标识符
    getPageId: function () {
      return window.location.pathname;
    },

    // 保存笔记
    saveNote: function (content) {
      const pageId = this.getPageId();
      const notes = this.getAllNotes();

      // 为当前页面创建一个新的笔记条目
      if (!notes[pageId]) {
        notes[pageId] = [];
      }

      // 添加新笔记，包含时间戳
      notes[pageId].push({
        content: content,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      });

      // 保存到localStorage
      localStorage.setItem("page_notes", JSON.stringify(notes));
      return notes[pageId][notes[pageId].length - 1];
    },

    // 获取所有笔记
    getAllNotes: function () {
      const notesStr = localStorage.getItem("page_notes");
      return notesStr ? JSON.parse(notesStr) : {};
    },

    // 获取当前页面的笔记
    getPageNotes: function () {
      const pageId = this.getPageId();
      const notes = this.getAllNotes();
      return notes[pageId] || [];
    },

    // 删除笔记
    deleteNote: function (noteId) {
      const pageId = this.getPageId();
      const notes = this.getAllNotes();

      if (notes[pageId]) {
        notes[pageId] = notes[pageId].filter((note) => note.id !== noteId);
        localStorage.setItem("page_notes", JSON.stringify(notes));
      }
    },

    // 更新笔记
    updateNote: function (noteId, content) {
      const pageId = this.getPageId();
      const notes = this.getAllNotes();

      if (notes[pageId]) {
        const noteIndex = notes[pageId].findIndex((note) => note.id === noteId);
        if (noteIndex !== -1) {
          notes[pageId][noteIndex].content = content;
          notes[pageId][noteIndex].updated = new Date().toISOString();
          localStorage.setItem("page_notes", JSON.stringify(notes));
        }
      }
    },
  };

  // 创建笔记浮窗
  function createNotePopup(x, y) {
    // 创建文本区域
    const textarea = document.createElement("textarea");
    textarea.className = "note-textarea";
    textarea.placeholder = "在此处输入笔记...";
    textarea.rows = 6;
    textarea.style.width = "calc(100% - 1px)";
    textarea.style.resize = "vertical";
    textarea.style.fontFamily = "inherit";
    textarea.style.padding = "8px";
    textarea.style.border = "1px solid #ddd";
    textarea.style.borderRadius = "4px";
    textarea.style.boxSizing = "border-box";

    // 创建保存按钮
    const saveButton = document.createElement("button");
    saveButton.textContent = "保存笔记";
    saveButton.className = "note-save-button";
    saveButton.style.marginTop = "10px";
    saveButton.style.padding = "5px 10px";
    saveButton.style.backgroundColor = "#4CAF50";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "4px";
    saveButton.style.cursor = "pointer";

    // 创建容器
    const container = document.createElement("div");
    container.appendChild(textarea);
    container.appendChild(saveButton);

    // 创建浮窗
    const popup = window.diagramRenderUtils.popupWindowUtils.create({
      title: "Note",
      content: container,
      x: x,
      y: y,
      minWidth: 300,
      maxWidth: "30%",
      maxHeight: "50%",
      closeOnClickOutside: false,
      closeOnEsc: true,
      className: "note-editor resizable",
    });

    // 保存按钮点击事件
    saveButton.addEventListener("click", function () {
      const noteContent = textarea.value.trim();
      if (noteContent) {
        // 保存笔记
        const savedNote = noteStorage.saveNote(noteContent);

        // 关闭编辑浮窗
        popup.close();

        // 显示保存成功提示
        const successMsg = document.createElement("div");
        successMsg.textContent = "笔记已保存！";
        successMsg.style.padding = "10px";
        successMsg.style.color = "#4CAF50";

        window.diagramRenderUtils.popupWindowUtils.create({
          title: "保存成功",
          content: successMsg,
          x: x,
          y: y,
          minWidth: 200,
          closeOnClickOutside: true,
          closeOnEsc: true,
          onClose: function () {
            // 可以在这里添加关闭后的回调
          },
        });
      } else {
        // 提示用户输入内容
        textarea.placeholder = "请输入笔记内容后再保存";
        textarea.style.borderColor = "#ff6b6b";
      }
    });

    // 聚焦到文本区域
    setTimeout(() => textarea.focus(), 100);

    return popup;
  }

  // 显示页面上的所有笔记
  function showAllNotes(x, y) {
    const notes = noteStorage.getPageNotes();

    // 创建笔记列表容器
    const notesContainer = document.createElement("div");
    notesContainer.className = "notes-list-container";

    if (notes.length === 0) {
      // 没有笔记时显示提示
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "当前页面没有保存的笔记";
      emptyMsg.style.color = "#666";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.padding = "20px 0";
      notesContainer.appendChild(emptyMsg);
    } else {
      // 显示所有笔记
      notes.forEach((note) => {
        // 创建笔记项容器
        const noteItem = document.createElement("div");
        noteItem.className = "note-item";
        noteItem.style.marginBottom = "15px";
        noteItem.style.padding = "10px";
        noteItem.style.backgroundColor = "#f9f9f9";
        noteItem.style.borderRadius = "4px";
        noteItem.style.border = "1px solid #eee";

        // 创建笔记内容
        const noteContent = document.createElement("div");
        noteContent.className = "note-content";
        noteContent.textContent = note.content;
        noteContent.style.marginBottom = "8px";
        noteContent.style.whiteSpace = "pre-wrap";

        // 创建笔记时间
        const noteTime = document.createElement("div");
        noteTime.className = "note-time";
        const date = new Date(note.timestamp);
        noteTime.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        noteTime.style.fontSize = "0.8em";
        noteTime.style.color = "#888";

        // 创建操作按钮容器
        const actionButtons = document.createElement("div");
        actionButtons.className = "note-actions";
        actionButtons.style.marginTop = "8px";
        actionButtons.style.display = "flex";
        actionButtons.style.justifyContent = "flex-end";
        actionButtons.style.gap = "8px";

        // 编辑按钮
        const editButton = document.createElement("button");
        editButton.textContent = "编辑";
        editButton.className = "note-edit-button";
        editButton.style.padding = "3px 8px";
        editButton.style.backgroundColor = "#4a90e2";
        editButton.style.color = "white";
        editButton.style.border = "none";
        editButton.style.borderRadius = "3px";
        editButton.style.cursor = "pointer";
        editButton.style.fontSize = "0.8em";

        // 删除按钮
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "删除";
        deleteButton.className = "note-delete-button";
        deleteButton.style.padding = "3px 8px";
        deleteButton.style.backgroundColor = "#ff6b6b";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.borderRadius = "3px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.fontSize = "0.8em";

        // 添加按钮到操作容器
        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);

        // 组装笔记项
        noteItem.appendChild(noteContent);
        noteItem.appendChild(noteTime);
        noteItem.appendChild(actionButtons);

        // 添加到笔记列表
        notesContainer.appendChild(noteItem);

        // 编辑按钮点击事件
        editButton.addEventListener("click", function () {
          // 创建编辑浮窗
          const editTextarea = document.createElement("textarea");
          editTextarea.value = note.content;
          editTextarea.rows = 6;
          editTextarea.style.width = "calc(100% - 1px)";
          editTextarea.style.resize = "vertical";
          editTextarea.style.padding = "8px";
          editTextarea.style.border = "1px solid #ddd";
          editTextarea.style.borderRadius = "4px";
          editTextarea.style.boxSizing = "border-box";

          const updateButton = document.createElement("button");
          updateButton.textContent = "更新笔记";
          updateButton.style.marginTop = "10px";
          updateButton.style.padding = "5px 10px";
          updateButton.style.backgroundColor = "#4CAF50";
          updateButton.style.color = "white";
          updateButton.style.border = "none";
          updateButton.style.borderRadius = "4px";
          updateButton.style.cursor = "pointer";

          const editContainer = document.createElement("div");
          editContainer.appendChild(editTextarea);
          editContainer.appendChild(updateButton);

          const editPopup = window.diagramRenderUtils.popupWindowUtils.create({
            title: "编辑笔记",
            content: editContainer,
            x: x,
            y: y,
            minWidth: 300,
            maxWidth: "30%",
            maxHeight: "50%",
            closeOnClickOutside: false,
            closeOnEsc: true,
            className: "note-editor resizable",
          });

          // 更新按钮点击事件
          updateButton.addEventListener("click", function () {
            const updatedContent = editTextarea.value.trim();
            if (updatedContent) {
              // 更新笔记
              noteStorage.updateNote(note.id, updatedContent);

              // 更新显示的内容
              noteContent.textContent = updatedContent;

              // 关闭编辑浮窗
              editPopup.close();
            } else {
              // 提示用户输入内容
              editTextarea.placeholder = "请输入笔记内容后再保存";
              editTextarea.style.borderColor = "#ff6b6b";
            }
          });

          // 聚焦到文本区域
          setTimeout(() => editTextarea.focus(), 100);
        });

        // 删除按钮点击事件
        deleteButton.addEventListener("click", function () {
          // 创建确认对话框
          const confirmMsg = document.createElement("div");
          confirmMsg.textContent = "确定要删除这条笔记吗？";
          confirmMsg.style.marginBottom = "15px";

          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.justifyContent = "space-between";

          const confirmButton = document.createElement("button");
          confirmButton.textContent = "确定删除";
          confirmButton.style.padding = "5px 10px";
          confirmButton.style.backgroundColor = "#ff6b6b";
          confirmButton.style.color = "white";
          confirmButton.style.border = "none";
          confirmButton.style.borderRadius = "4px";
          confirmButton.style.cursor = "pointer";

          const cancelButton = document.createElement("button");
          cancelButton.textContent = "取消";
          cancelButton.style.padding = "5px 10px";
          cancelButton.style.backgroundColor = "#ccc";
          cancelButton.style.color = "white";
          cancelButton.style.border = "none";
          cancelButton.style.borderRadius = "4px";
          cancelButton.style.cursor = "pointer";

          buttonContainer.appendChild(cancelButton);
          buttonContainer.appendChild(confirmButton);

          const confirmContainer = document.createElement("div");
          confirmContainer.appendChild(confirmMsg);
          confirmContainer.appendChild(buttonContainer);

          const confirmPopup =
            window.diagramRenderUtils.popupWindowUtils.create({
              title: "确认删除",
              content: confirmContainer,
              x: x,
              y: y,
              minWidth: 250,
              closeOnClickOutside: false,
              closeOnEsc: true,
              className: "note-confirm",
            });

          // 确认删除
          confirmButton.addEventListener("click", function () {
            // 删除笔记
            noteStorage.deleteNote(note.id);

            // 从DOM中移除笔记项
            notesContainer.removeChild(noteItem);

            // 关闭确认对话框
            confirmPopup.close();

            // 如果删除后没有笔记了，显示空消息
            if (noteStorage.getPageNotes().length === 0) {
              const emptyMsg = document.createElement("p");
              emptyMsg.textContent = "当前页面没有保存的笔记";
              emptyMsg.style.color = "#666";
              emptyMsg.style.textAlign = "center";
              emptyMsg.style.padding = "20px 0";
              notesContainer.appendChild(emptyMsg);
            }
          });

          // 取消删除
          cancelButton.addEventListener("click", function () {
            confirmPopup.close();
          });
        });
      });
    }

    // 创建新增笔记按钮
    const addButton = document.createElement("button");
    addButton.textContent = "+ 新增笔记";
    addButton.style.width = "100%";
    addButton.style.padding = "8px";
    addButton.style.marginTop = "10px";
    addButton.style.backgroundColor = "#4CAF50";
    addButton.style.color = "white";
    addButton.style.border = "none";
    addButton.style.borderRadius = "4px";
    addButton.style.cursor = "pointer";

    // 创建容器并添加笔记列表和新增按钮
    const container = document.createElement("div");
    container.appendChild(notesContainer);
    container.appendChild(addButton);

    // 创建浮窗
    const popup = window.diagramRenderUtils.popupWindowUtils.create({
      title: "页面笔记",
      content: container,
      x: x,
      y: y,
      minWidth: 350,
      maxWidth: "40%",
      maxHeight: "60%",
      closeOnClickOutside: true,
      closeOnEsc: true,
      className: "notes-list resizable",
    });

    // 新增笔记按钮点击事件
    addButton.addEventListener("click", function () {
      popup.close();
      createNotePopup(x, y);
    });

    return popup;
  }

  // 添加右键菜单
  document.addEventListener("contextmenu", function (e) {
    // 检查是否点击在空白区域
    // 这里定义"空白区域"为body或html元素，或者没有其他特定功能的容器元素
    const target = e.target;
    const tagName = target.tagName.toLowerCase();

    // 排除一些不应该触发笔记功能的元素
    const excludedElements = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      "img",
      "svg",
      "canvas",
      "video",
      "audio",
      "iframe",
    ];
    const excludedClasses = ["code-rendered-diagram", "popup-window"];

    // 检查元素是否应该被排除
    const isExcludedTag = excludedElements.includes(tagName);
    const hasExcludedClass = Array.from(target.classList).some((cls) =>
      excludedClasses.some((excl) => cls.includes(excl))
    );
    const isEditable = target.isContentEditable;

    // 如果是可以触发笔记功能的区域
    if (!isExcludedTag && !hasExcludedClass && !isEditable) {
      // 阻止默认右键菜单
      e.preventDefault();

      // 创建自定义右键菜单
      const menuContainer = document.createElement("div");
      menuContainer.className = "note-context-menu";
      menuContainer.style.position = "fixed";
      menuContainer.style.zIndex = "10001";
      menuContainer.style.backgroundColor = "white";
      menuContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
      menuContainer.style.borderRadius = "4px";
      menuContainer.style.padding = "5px 0";

      // 添加菜单项
      const menuItems = [
        {
          text: "添加笔记",
          action: () => createNotePopup(e.clientX, e.clientY),
        },
        {
          text: "查看所有笔记",
          action: () => showAllNotes(e.clientX, e.clientY),
        },
      ];

      menuItems.forEach((item) => {
        const menuItem = document.createElement("div");
        menuItem.className = "note-context-menu-item";
        menuItem.textContent = item.text;
        menuItem.style.padding = "8px 15px";
        menuItem.style.cursor = "pointer";
        menuItem.style.transition = "background-color 0.2s";

        menuItem.addEventListener("mouseenter", () => {
          menuItem.style.backgroundColor = "#f0f0f0";
        });

        menuItem.addEventListener("mouseleave", () => {
          menuItem.style.backgroundColor = "transparent";
        });

        menuItem.addEventListener("click", () => {
          document.body.removeChild(menuContainer);
          item.action();
        });

        menuContainer.appendChild(menuItem);
      });

      // 设置菜单位置
      menuContainer.style.left = `${e.clientX}px`;
      menuContainer.style.top = `${e.clientY}px`;

      // 添加到文档
      document.body.appendChild(menuContainer);

      // 点击其他区域关闭菜单
      const closeMenu = function (e) {
        if (!menuContainer.contains(e.target)) {
          if (document.body.contains(menuContainer)) {
            document.body.removeChild(menuContainer);
          }
          document.removeEventListener("mousedown", closeMenu);
        }
      };

      // 延迟绑定，防止创建时的点击立即关闭
      setTimeout(() => {
        document.addEventListener("mousedown", closeMenu);
      }, 100);
    }
  });
});
