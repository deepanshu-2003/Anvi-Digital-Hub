import NoteContext from "./noteContext";
import React, { useState } from "react";
const NoteState = (props) => {
  const host = "http://localhost:5000";
  const [course, setCourse] = useState([]);
//   const [user, setUser] = useState("user");
//   const [alerts, setAlerts] = useState([]);
  const fetchAllCourses = async () => {
    // API calls
    const url = `${host}/courses`;
    const headers = {
    //   auth_token: localStorage.getItem("token"),
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    const json = await response.json();
    console.log(json);
    setCourse(json);
  };

//   const fetchUsername = async () => {
//     // API calls
//     const url = `${host}/auth/get-user`;
//     const headers = {
//       auth_token: localStorage.getItem("token"),
//       "Content-Type": "application/json",
//     };
//     const response = await fetch(url, {
//       method: "POST",
//       headers,
//     });
//     const json = await response.json();
//     // console.log(json);
//     setUser(`${json.first_name} ${json.last_name}`);
//   };
  const addNote = async (title, note, tag) => {
    // API calls
    const url = `${host}/notes/create-note`;
    const headers = {
      auth_token: localStorage.getItem("token"),
      "Content-Type": "application/json",
    };
    if (tag === "") {
      tag = "General";
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, note, tag }),
      });
      if (!response.ok) {
        console.log(response.status);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const editNote = async (_id, title, note, tag) => {
    // API calls
    const url = `${host}/notes/update/${_id}`;
    const headers = {
      auth_token: localStorage.getItem("token"),
      "Content-Type": "application/json",
    };
    const newNote = { title, note, tag };
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(newNote),
    });
    // Logic to edit the note
    for (let i = 0; i < notes.length; i++) {
      let element = notes[i];
      if (element._id === _id) {
        element.title = title;
        element.note = note;
        element.tag = tag;
      }
    }
  };

  const deleteNote = async (_id) => {
    const url = `${host}/notes/delete/${_id}`;
    const headers = {
      auth_token: localStorage.getItem("token"),
      "Content-Type": "application/json",
    };
    await fetch(url, {
      method: "POST",
      headers,
      body: null,
    });
  };

  const addAlert = (message, type) => {
    if (!alerts.some(alert=>alert.message === message && alert.type===type)) {
      setAlerts([...alerts, { message, type }]);
    }
  };
  const clearAlert = (message) => {
    setAlerts(
      alerts.filter((alert) => {
        return alert.message !== message;
      })
    );
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        setNotes,
        addNote,
        editNote,
        deleteNote,
        fetchAllNotes,
        user,
        fetchUsername,
        setUser,
        alerts,
        addAlert,
        clearAlert,
      }}
    >
      {props.children}
    </NoteContext.Provider>
  );
};

export default NoteState;