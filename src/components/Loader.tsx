import React from "react";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="loader">
      <div className="square">
        <div className="mini_square sq-1"></div>
        <div className="mini_square sq-2"></div>
        <div className="mini_square"></div>
        <div className="mini_square sq-4"></div>
      </div>
    </div>
  );
};

export default Loader;
