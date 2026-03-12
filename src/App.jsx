import { SignedIn, SignedOut, SignInButton, UserButton, useSession } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Trash2, Plus, LayoutGrid, Calendar, Settings, Heart, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import confetti from 'canvas-confetti';


const colors = {
  bg: "#E3F2FD",      
  card: "#FFFFFF",    
  primary: "#90CAF9", 
  accent: "#F48FB1",  
  success: "#A5D6A7", 
  text: "#444444"     
};
const CATEGORY_MAP = {
  "🌱 Personal": { color: "#A5D6A7" },
  "💼 Work": { color: "#90CAF9" },
  "🍎 Health": { color: "#F48FB1" },
  "🏠 Home": { color: "#CE93D8" },
  "📚 Study": { color: "#FFCC80" }
};
const ProgressBar = ({ label, current, total }) => {
  const progress = total === 0 ? 0 : (current / total) * 100;

  const barColor = progress === 100 ? colors.success : colors.primary;

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: colors.text, marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>{label}</span>
        <span style={{ opacity: 0.8 }}>{current} / {total} ({Math.round(progress)}%)</span>
      </div>
      <div style={{ background: '#eee', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `${progress}%`,
            backgroundColor: barColor 
          }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};
const TaskItem = ({ title, completed, type, category, priority, onToggle, onDelete, onEdit }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  return (
    <motion.div 
      //layout

      animate={priority && !completed ? { 
        boxShadow: [
          "0px 2px 8px rgba(0,0,0,0.02)", 
          `0px 0px 15px ${colors.accent}44`, 
          "0px 2px 8px rgba(0,0,0,0.02)"
        ] 
      } : { boxShadow: "0px 2px 8px rgba(0,0,0,0.02)" }}
      transition={{ repeat: Infinity, duration: 3 }}
      style={{ 
        background: 'white', padding: '12px 16px', borderRadius: '16px', 
        marginBottom: '10px', display: 'flex', alignItems: 'center',
        gap: '12px', cursor: 'pointer',
        borderLeft: priority 
          ? `6px solid ${colors.accent}` 
          : `5px solid ${type === 'daily' ? colors.accent : colors.primary}`
      }}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }} 
        style={{ 
          width: '20px', height: '20px', borderRadius: '50%', 
          border: `2px solid ${colors.primary}`,
          background: completed ? colors.primary : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}
      >
        {completed && "✓"}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? '#bbb' : colors.text,
            fontSize: '1rem'
          }}>
            {title}
          </span>
          {/* Small heart icon next to title if high priority */}
          {priority && <Heart size={14} fill= "#FF5252" color="#FF5252" />}
        </div>
        
        {category && (
          <span style={{ 
            fontSize: '0.65rem', 
            opacity: completed ? 0.5 : 0.8,
            fontWeight: 'bold',
            color: CATEGORY_MAP[category]?.color || "#888" 
          }}>
            {category.toUpperCase()}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
        {/* --- EDIT BUTTON --- */}
        {!completed && ( 
          <motion.div 
            whileHover={{ color: colors.primary, scale: 1.2 }} 
            onClick={onEdit} 
            style={{ color: '#ccc', padding: '4px', cursor: 'pointer' }}
          >
            <Pencil size={16} />
          </motion.div>
        )}
        {isConfirming ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onDelete} style={{ background: colors.accent, color: 'white', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem' }}>Delete</button>
            <button onClick={() => setIsConfirming(false)} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem' }}>No</button>
          </motion.div>
        ) : (
          <motion.div whileHover={{ color: colors.accent, scale: 1.2 }} onClick={() => setIsConfirming(true)} style={{ color: '#ccc', padding: '4px' }}>
            <Trash2 size={18} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
// MAIN APP FUNCTION
function App() {
  const { session } = useSession();
  const [todoData, setTodoData] = useState(null);
  const [category, setCategory] = useState("🌱 Personal");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [taskType, setTaskType] = useState("normal");
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskName("");
    setIsHighPriority(false);
    setTaskType("normal");
  };
  const fetchTasks = async () => {
      if (!session) return;
      try {
        const token = await session.getToken();
        const response = await fetch("https://todo-app-87u5.onrender.com/api/tasks/my-day", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTodoData({
            ...data,
            dailyTasks: data.dailyTasks || [],
            normalTasks: data.normalTasks || [],
          });
        } else {
          console.error("Server responded with error:", response.status);
        }
      } catch (err) {
        console.error("Fetch failed completely:", err);
      }
    };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !session) return;

    try {
      const token = await session.getToken();
      
      if (editingTask && editingTask.type !== taskType) {
        await fetch(`https://todo-app-87u5.onrender.com/api/tasks/delete/${editingTask.type}/${editingTask.index}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        setEditingTask(null);
      }

      const url = editingTask 
        ? `https://todo-app-87u5.onrender.com/api/tasks/update/${editingTask.type}/${editingTask.index}`
        : "https://todo-app-87u5.onrender.com/api/tasks/add";
      
      const response = await fetch(url, {
        method: "POST", 
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTaskName,
          type: taskType,
          category: category,
          highPriority: isHighPriority,
          completed: editingTask ? todoData[`${editingTask.type}Tasks`][editingTask.index].completed : false
        }),
      });

      if (response.ok) {
        const updatedDay = await response.json();
        setTodoData(updatedDay); 
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save task:", err);
    }
  };
    const handleToggleTask = async (type, index) => {
      if (!session) return;
      const currentTasks = type === "daily" ? todoData.dailyTasks : todoData.normalTasks;
      const isCurrentlyCompleted = currentTasks[index].Completed;
      try {
        const token = await session.getToken();
        const response = await fetch(`https://todo-app-87u5.onrender.com/api/tasks/toggle/${type}/${index}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const updatedDay = await response.json();
          //console.log("Toggle successful, new data:", updatedDay);
          if (!isCurrentlyCompleted) {
            confetti({
              particleCount: 40,
              scalar: 0.7,
              shapes: ['circle'],
              origin: { x: 0.5, y: 0.8 },
              colors: [colors.success]
            });
          }
          setTodoData({...updatedDay}); 
        }
      } catch (err) {
        console.error("Toggle failed:", err);
      }
    };
    const handleDeleteTask = async (type, index) => {
      if (!session) return;
      try {
        const token = await session.getToken();
        const response = await fetch(`https://todo-app-87u5.onrender.com/api/tasks/delete/${type}/${index}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const updatedDay = await response.json();
          setTodoData({ ...updatedDay });
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    };
    const handleClearCompleted = async () => {
      if (!session) return;
      try {
        const token = await session.getToken();
        const response = await fetch("https://todo-app-87u5.onrender.com/api/tasks/clear-completed", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const updatedDay = await response.json();
          
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [colors.primary, colors.accent, colors.success]
          });
          setTodoData({ ...updatedDay });
        }
      } catch (err) {
        console.error("Clear failed:", err);
      }
    };
    const handleOpenEdit = (type, index, task) => {
      setEditingTask({ type, index });
      setNewTaskName(task.title);
      setCategory(task.category);
      setIsHighPriority(task.highPriority);
      setTaskType(type);
      setIsModalOpen(true); 
    };
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        console.log("Session ready, fetching tasks...");
        await fetchTasks();
      }
    };
    loadData();
  }, [session]);

  const navButtons = [
    { icon: <LayoutGrid size={24} />, label: "Dashboard" },
    { icon: <Calendar size={24} />, label: "History" },
    { icon: <Plus size={32} />, label: "Add", primary: true },
    { icon: <Heart size={24} />, label: "Focus" },
    { icon: <Settings size={24} />, label: "Settings" }
  ];
  const highPriorityCount = todoData 
  ? [...(todoData.dailyTasks || []), ...(todoData.normalTasks || [])]
      .filter(t => t.highPriority && !t.Completed && !t.completed).length 
  : 0;
  return (
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh", color: colors.text, paddingBottom: '100px' }}>
      
      <header style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: colors.primary, fontSize: '1.5rem', fontWeight: 'bold' }}>To-do list ✨</h1>
        <SignedIn><UserButton /></SignedIn>
      </header>

      <main style={{ padding: "0 20px" }}>
        <SignedIn>
          {/* --- FILTER BAR --- */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          padding: '10px 0 20px 0',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'   
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter("All")}
            style={{
              padding: '8px 16px',
              borderRadius: '15px',
              border: 'none',
              background: activeFilter === "All" ? colors.primary : 'white',
              color: activeFilter === "All" ? 'white' : colors.text,
              whiteSpace: 'nowrap',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
          >
            All Tasks
          </motion.button>
=
          {Object.keys(CATEGORY_MAP).map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '15px',
                border: 'none',
                background: activeFilter === cat ? CATEGORY_MAP[cat].color : 'white',
                color: activeFilter === cat ? 'white' : colors.text,
                whiteSpace: 'nowrap',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
        {/* --- FOCUS MODE BANNER --- */}
        {activeFilter === "Priority" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            style={{ 
              background: '#FF525215', 
              border: '1px solid #FF525244',
              borderRadius: '16px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={16} fill="#FF5252" color="#FF5252" />
              <span style={{ color: '#FF5252', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Focus Mode: High Priority Only
              </span>
            </div>
            <button 
              onClick={() => setActiveFilter("All")}
              style={{ 
                background: '#FF5252', 
                color: 'white', 
                border: 'none', 
                padding: '4px 12px', 
                borderRadius: '10px', 
                fontSize: '0.7rem', 
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Show All
            </button>
          </motion.div>
        )}
          {todoData && (
            
            <div style={{ background: colors.card, padding: '20px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <ProgressBar 
                label="Daily Goals" 
                current={todoData.dailyTasks?.filter(t => t.Completed).length || 0} 
                total={todoData.dailyTasks?.length || 0} 
              />
              <ProgressBar 
                label="Normal Tasks" 
                current={todoData.normalTasks?.filter(t => t.Completed).length || 0} 
                total={todoData.normalTasks?.length || 0} 
              />
            </div>
          )}

          <div style={{ background: colors.card, padding: '20px', borderRadius: '24px' }}>
          <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h3 style={{ margin: 0 }}>Current Tasks</h3>

              {todoData?.normalTasks?.some(t => t.Completed) && (
                <motion.button
                  whileHover={{ scale: 1.05, color: colors.accent }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearCompleted}
                  style={{ 
                    background: 'none', border: 'none', color: colors.primary, 
                    fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Trash2 size={14} /> Clear Finished
                </motion.button>
              )}
            </div>
            
            {todoData ? (
              <div style={{ marginTop: '20px' }}>
                
                {/* 1. Mapping Daily Tasks */}
                <h3 style={{ fontSize: '1rem', color: colors.accent }}>☀️ Daily Goals</h3>
                {todoData.dailyTasks?.filter(task => {
                  if (activeFilter === "All") return true;
                  if (activeFilter === "Priority") return task.highPriority === true;
                  return task.category === activeFilter;
                }).map((task, i) => (                  
                  <TaskItem 
                    key={`daily-${i}`} 
                    title={task.title} 
                    completed={task.Completed} 
                    category={task.category}
                    type="daily" 
                    priority={task.highPriority}
                    onToggle={() => handleToggleTask("daily", i)} 
                    onEdit={() => handleOpenEdit("daily", i, task)}
                    onDelete={() => handleDeleteTask("daily", i)}
                  />
                ))}

                {/* 2. Mapping Normal Tasks */}
                <h3 style={{ fontSize: '1rem', color: colors.primary, marginTop: '24px' }}>✨ To-Do List</h3>
                {todoData.normalTasks?.filter(task => {
                  if (activeFilter === "All") return true;
                  if (activeFilter === "Priority") return task.highPriority === true; 
                  return task.category === activeFilter;
                }).map((task, i) => (
                  <TaskItem 
                    key={`normal-${i}`} 
                    title={task.title} 
                    completed={task.Completed} 
                    category={task.category}
                    type="normal" 
                    priority={task.highPriority}
                    onToggle={() => handleToggleTask("normal", i)} 
                    onEdit={() => handleOpenEdit("normal", i, task)}
                    onDelete={() => handleDeleteTask("normal", i)}
                  />
                ))}

                {todoData.dailyTasks?.length === 0 && todoData.normalTasks?.length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>
                    Looking quiet here... 🌱
                  </p>
                )}

              </div>
            ) : (
              <p>Starting...</p>
            )}
          </div>
        </SignedIn>

        <SignedOut>
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Chào em iuuuuuuuu</h2>
            <SignInButton mode="modal">
              <button style={{ background: colors.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      <nav style={{ 
        position: 'fixed', bottom: 0, width: '100%', maxWidth: '100vw',
        background: 'white', display: 'flex', justifyContent: 'space-around', 
        padding: '10px 0', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        boxShadow: '0 -5px 15px rgba(0,0,0,0.05)', alignItems: 'center'
      }}>
      {navButtons.map((btn, i) => {
        const isAddButton = btn.label === "Add";
        const isFocusButton = btn.label === "Focus";
        const isEnabled = isAddButton || isFocusButton; 
        
        const isFocusActive = isFocusButton && activeFilter === "Priority";

        return (
          <motion.button 
            key={i} 
            whileHover={isEnabled ? { scale: 1.1 } : {}}
            whileTap={isEnabled ? { scale: 0.9 } : {}}
            onClick={() => {
              if (isAddButton) {
                setEditingTask(null); 
                setNewTaskName("");   
                setTaskType("normal");
                setIsModalOpen(true);
              }
              if (isFocusButton) {
                setActiveFilter(activeFilter === "Priority" ? "All" : "Priority");
              }
            }}
            style={{ 
              border: 'none', 
              background: btn.primary ? colors.primary : 'none',
              color: isFocusButton 
                ? (isFocusActive ? "#FF5252" : "#FF8A80") 
                : (btn.primary ? 'white' : colors.primary),
              
              borderRadius: btn.primary ? '50%' : '12px',
              width: btn.primary ? '60px' : 'auto',
              height: btn.primary ? '60px' : 'auto',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isEnabled ? 'pointer' : 'default', 
              marginBottom: btn.primary ? '35px' : '0',
              opacity: isEnabled ? 1 : 0.3, 
              
              boxShadow: btn.primary ? '0 8px 20px rgba(144, 202, 249, 0.4)' : 'none',
              transition: 'color 0.3s ease' 
            }}
          >
            {isFocusButton ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={24} fill={isFocusActive ? "#FF5252" : "none"} />
                
                {highPriorityCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#FF5252',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {highPriorityCount}
                  </motion.div>
                )}
              </div>
            ) : (
              btn.icon
            )}
          </motion.button>
        );
      })}
      </nav>

      {/* MODAL SECTION */}
      {isModalOpen && (
      <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '28px', 
              width: '90%', // Use 90% so there's a gap on mobile
              maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box' // Ensures padding doesn't push width out
            }}
          >
            <h2 style={{ marginTop: 0, color: colors.primary }}>{editingTask ? "Edit Task ✏️" : "New Task ✨"}</h2>
            <input 
              autoFocus
              placeholder="What are we doing today?"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '15px', 
                borderRadius: '15px', 
                border: `2px solid ${colors.bg}`, 
                outline: 'none', 
                marginBottom: '20px',
                boxSizing: 'border-box' // <--- ADD THIS LINE HERE
              }}
            />
            <p style={{ 
              fontSize: '0.8rem', 
              marginBottom: '8px', 
              marginTop: '10px', 
              opacity: 0.7, 
              fontWeight: 'bold',
              color: colors.text 
            }}>
              Category
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {Object.keys(CATEGORY_MAP).map((catLabel) => {
                const catColor = CATEGORY_MAP[catLabel].color;
                
                return (
                  <motion.button
                    key={catLabel} 
                    onClick={() => setCategory(catLabel)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      background: category === catLabel ? catColor : '#f0f0f0',
                      color: category === catLabel ? 'white' : '#666',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {catLabel} 
                  </motion.button>
                );
              })}
            </div>
            <p style={{ 
              fontSize: '0.75rem', 
              marginBottom: '8px', 
              opacity: 0.7, 
              fontWeight: 'bold',
              color: colors.text 
            }}>
              Importance
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsHighPriority(!isHighPriority)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '15px',
                border: `2px solid ${isHighPriority ? colors.accent : '#eee'}`,
                background: isHighPriority ? `${colors.accent}15` : 'transparent',
                color: isHighPriority ? colors.accent : '#888',
                fontWeight: 'bold',
                marginBottom: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <Heart size={18} fill={isHighPriority ? colors.accent : "none"} />
              {isHighPriority ? "HIGH PRIORITY SET" : "Mark as Important?"}
            </motion.button>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                onClick={() => setTaskType("normal")}
                style={{ 
                  flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                  background: taskType === "normal" ? colors.primary : '#eee',
                  color: taskType === "normal" ? 'white' : colors.text
                }}
              >
                ✨ Normal
              </button>
              <button
                onClick={() => setTaskType("daily")}
                style={{ 
                  flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                  background: taskType === "daily" ? colors.accent : '#eee',
                  color: taskType === "daily" ? 'white' : colors.text
                }}
              >
                ☀️ Daily
              </button>
            </div>            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={closeModal} 
                style={{ flex: 1, background: '#eee', border: 'none', padding: '12px', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTask}
                style={{ flex: 2, background: colors.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '12px' }}
              >
                {editingTask ? "Save Changes ✏️" : "Add to Garden ✨"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;