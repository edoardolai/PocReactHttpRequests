import { useRef, useState, useCallback, useEffect } from 'react';

import Places from './components/Places.jsx';
import Error from './components/Error.jsx';
import Modal from './components/Modal.jsx';
import DeleteConfirmation from './components/DeleteConfirmation.jsx';
import logoImg from './assets/logo.png';
import AvailablePlaces from './components/AvailablePlaces.jsx';
import { updateUserPlaces, fetchUserPlaces } from './http'
function App() {
  const selectedPlace = useRef();

  const [userPlaces, setUserPlaces] = useState([]);
  const [isFetching, setIsFetching] = useState(false)
  const [errorUpdatingPlaces, setErrorUpdatingPlaces] = useState();
  const [errorFetchingUserPlaces, setFetchingUserPlacesError] = useState();


  useEffect(() =>{
    async function fetchInitialUserPlaces(){
      setIsFetching(true)
      try{
        const places = await fetchUserPlaces()
        setUserPlaces(places)       
      }catch (error){
        setFetchingUserPlacesError({
          message: error.message || 'Error fetching initial user places'
        })
      }
      setIsFetching(false)
    }
    fetchInitialUserPlaces()
  }, [])

  const [modalIsOpen, setModalIsOpen] = useState(false);

  function handleStartRemovePlace(place) {
    setModalIsOpen(true);
    selectedPlace.current = place;
  }

  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  async function handleSelectPlace(selectedPlace) {
    setUserPlaces((prevPickedPlaces) => {
      if (!prevPickedPlaces) {
        prevPickedPlaces = [];
      }
      if (prevPickedPlaces.some((place) => place.id === selectedPlace.id)) {
        return prevPickedPlaces;
      }
      return [selectedPlace, ...prevPickedPlaces];
    });

    // when the put request is made here new changed state is not available yet
    // hence needs to be passed this way appending the newly added place to old state
    try {
      await updateUserPlaces([selectedPlace, ...userPlaces])
    } catch (error) {
      //if something goes wrong roll-back to prev state
      setUserPlaces(userPlaces)
      setErrorUpdatingPlaces({
        message: error.message || 'Failed to update places.'
      })

    }
  }

  const handleRemovePlace = useCallback(async function handleRemovePlace() {
    setUserPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current.id)
    );

    try{
      updateUserPlaces(userPlaces.filter(place => place.id !== selectedPlace.current.id))
    }catch(error){
      setUserPlaces(userPlaces)
      setErrorUpdatingPlaces({
        message: error.message || 'Failed to delete place.'
      })
    }

    setModalIsOpen(false);
  }, [userPlaces]);

  function handleError(){
    setErrorUpdatingPlaces(null)
  }

  function handleFetchUserPlacesError(){
    setErrorFetchingUserPlaces(null)
  }

  return (
    <>
      <Modal open={errorUpdatingPlaces} onClose={handleError}>
        {errorUpdatingPlaces && <Error title="Something went wrong" message={errorUpdatingPlaces.message} onConfirm={handleError}/>}
      </Modal>
      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
      {errorFetchingUserPlaces && <Error title="Something went wrong" message={errorFetchingUserPlaces.message}/>}
       {!errorFetchingUserPlaces && <Places
        isLoading={isFetching}
        loadingText='Fetching your places...'
          title="I'd like to visit ..."
          fallbackText="Select the places you would like to visit below."
          places={userPlaces}
          onSelectPlace={handleStartRemovePlace}
        />}

        <AvailablePlaces onSelectPlace={handleSelectPlace} />
      </main>
    </>
  );
}

export default App;
