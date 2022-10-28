import { collection, query, where, onSnapshot, orderBy, startAt, endAt, getDocs, getDoc, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState, div } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import add from "../img/bluebird.png";
import { Fragment } from "react";
import Swal from 'sweetalert2'
import { ChatContext } from "../context/ChatContext";
import { connectStorageEmulator } from "firebase/storage";

const Search = () => {

    const {dispatch} = useContext(ChatContext);

    const [username, setUsername] = useState("");
    const [user, setUser] = useState(null);
    const [err, setErr] = useState(false);
    const [err2, setErr2] = useState(false);

    const { currentUser } = useContext(AuthContext)

    // const [users, setUsers] = useState([]);

    const handleSearch = async () => {

        const q = query(
            collection(db, "users"),
            //where("displayName", "==", username)
            orderBy('displayName'), startAt(username), endAt(username + '\uf8ff')

        );
        const qVacio = query(
            collection(db, "users"),
            //where("displayName", "==", username)
            orderBy('displayName'), startAt(""), endAt("" + '\uf8ff')
        );

        if (username !== null && username != "") {
            try {
                let inicio = 0;
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    setUser(doc.data())
                    inicio++;
                });
                //console.error(user.uid)
                console.log("Cantidad de usuarios coincidentes: " + inicio);

                // setUsers(querySnapshot.doc.data())


                if (inicio == 0) {
                    setErr(true)
                    setUser(null)
                } else {
                    setErr(false)
                }

                let totalDeUsers = 0;
                const querySnapshotUsuarios = await getDocs(qVacio);
                querySnapshotUsuarios.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    //setUser(doc.data())
                    totalDeUsers++;
                });
                console.log("Cantidad total de usuarios: " + totalDeUsers);


            } catch (err) {
                setErr(true);
            }
        } else {
            setErr(true)
            setUser(null)
        }


    };
    const handleKey = (e) => {
        e.code === "Enter" && handleSearch();
        
    };

    const handleSelect = async (u) => {
        //verificar el gtupo (chats in firestore) existe o no, si existe no crear
        const combineId =
            currentUser.uid > user.uid
                ? currentUser.uid + user.uid
                : user.uid + currentUser.uid;
        try {
            const res = await getDoc(doc(db, "chats", combineId));

            if (!res.exists()) {
                //crear un chat en la coleccion de chats
                await setDoc(doc(db, "chats", combineId), { messages: [] });

                //crear chat de usuario
                /*userChats:{
                    janesid:{
                        combineId:{
                            userInfo{
                                dn, img, id 
                            },
                            lastMessage:"",
                            date:
                        }
                    }
                }*/
                await updateDoc(doc(db, "userChats", currentUser.uid), {
                    [combineId + ".userInfo"]: {
                        uid: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    },
                    [combineId + ".date"]: serverTimestamp()
                });

                await updateDoc(doc(db, "userChats", user.uid), {
                    [combineId + ".userInfo"]: {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                    },
                    [combineId + ".date"]: serverTimestamp()
                });
                
            } else {
                
                // Swal.fire({
                //     icon: 'error',
                //     title: '¡Ya existe un chat con ese usuario!',
                //     text: 'Revise sus chats para conversar con ese usuario.',
                //     confirmButtonText: 'Aceptar',
                // })
                //Search.handleSelect(user.userInfo);
            }
                
            


        } catch (err2) { }
        //Verificar chats de usuarios
        setUser(null);
        dispatch({type:"CHANGE_USER", payload: u });
        
        
        //setUsername("");

        
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        e.target.reset();
    }

    function focusOut() {
        //console.log(username)
        setErr(false)
    }

    const [chats, setChats] = useState([]);
    useEffect(() => {
        const getChats = () => {
            const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
                setChats(doc.data())
            });
    
            return () => {
                unsub();
            };
        };
        currentUser.uid && getChats()
    }, [currentUser.uid]);

    return (
        <div className="search">
            <div className="searchForm">
                <form onSubmit={handleSubmit}>
                    <input type="text"
                        placeholder="Buscar"
                        onKeyDown={handleKey}
                        onChange={(e) => setUsername(e.target.value)}
                        //value={username}
                        required
                        onBlur={focusOut}
                    />
                    {/* <input onKeyDown={handleKey} value="Enviar"/> */}
                </form>

            </div>
            {err && <div className="userChat"><span className="userChatInfo">¡Usuario no encontrado!</span></div>}
            {/* {err2 && Swal.fire({
                icon: 'error',
                title: '¡Ya existe chat con ese usuario!',
                text: 'Revise sus chats para conversar con ese usuario.',
                confirmButtonText: 'Aceptar',
            }).then((value) => {
                window.location.href = "/";
            })} */}
            {user && (<div className="userChat" onClick={() => handleSelect(user)}>
                <img src={user.photoURL} alt="" />
                <div className="userChatInfo">
                    <span>{user.displayName}</span>
                </div>
            </div>)}

            {/* {Object.entries(users)?.sort((a,b)=>b[1].date - a[1].date).map((user) => (
                <div className="userChat" onClick={handleSelect}>
                <img src={user.photoURL} alt="" />
                <div className="userChatInfo">
                    <span>{user.displayName}</span>
                </div>
            </div>
            ))} */}

            {/* {listItems} */}
        </div>
    )
}

export default Search