import { motion } from "framer-motion";
import { colors } from "../theme";

export default function ProgressBar({ label, current, total }) {
  const progress = total === 0 ? 0 : (current / total) * 100;

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: colors.text }}>
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div style={{ background: '#eee', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ background: colors.primary, height: '100%' }}
        />
      </div>
    </div>
  );
}