import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const EMOJI_CATEGORIES = [
    {
        name: "Smileys & Emotion",
        emojis: [
            { char: "😀", name: "grinning face", tags: ["happy", "smile"] },
            { char: "😃", name: "grinning face with big eyes", tags: ["happy", "joy"] },
            { char: "😄", name: "grinning face with smiling eyes", tags: ["laugh", "happy"] },
            { char: "😁", name: "beaming face", tags: ["grin", "happy"] },
            { char: "😆", name: "grinning squinting face", tags: ["haha", "laugh"] },
            { char: "😅", name: "grinning face with sweat", tags: ["relief", "sweat"] },
            { char: "😂", name: "face with tears of joy", tags: ["lol", "crying", "laugh"] },
            { char: "🤣", name: "rolling on the floor laughing", tags: ["rofl", "lol"] },
            { char: "😊", name: "smiling face with smiling eyes", tags: ["blush", "proud"] },
            { char: "😇", name: "smiling face with halo", tags: ["angel", "innocent"] },
            { char: "🙂", name: "slightly smiling face", tags: ["smile"] },
            { char: "😉", name: "winking face", tags: ["wink"] },
            { char: "😌", name: "relieved face", tags: ["peace", "calm"] },
            { char: "😍", name: "smiling face with heart-eyes", tags: ["love", "crush"] },
            { char: "🥰", name: "smiling face with hearts", tags: ["love", "warm"] },
            { char: "😘", name: "face blowing a kiss", tags: ["kiss", "love"] },
            { char: "😗", name: "kissing face", tags: ["kiss"] },
            { char: "😋", name: "face savoring food", tags: ["delicious", "yum"] },
            { char: "😛", name: "face with tongue", tags: ["tongue", "playful"] },
            { char: "😜", name: "winking face with tongue", tags: ["playful", "joke"] },
            { char: "🤪", name: "zany face", tags: ["crazy", "wild"] },
            { char: "😝", name: "squinting face with tongue", tags: ["prank"] },
            { char: "🤑", name: "money-mouth face", tags: ["money", "rich"] },
            { char: "🤗", name: "smiling face with open hands", tags: ["hug"] },
            { char: "🤭", name: "face with hand over mouth", tags: ["oops", "secret"] },
            { char: "🤫", name: "shushing face", tags: ["quiet", "shh"] },
            { char: "🤔", name: "thinking face", tags: ["think", "ponder"] },
            { char: "🤐", name: "zipper-mouth face", tags: ["shut", "silent"] },
            { char: "🤨", name: "face with raised eyebrow", tags: ["skeptical", "suspicious"] },
            { char: "😐", name: "neutral face", tags: ["meh"] },
            { char: "😑", name: "expressionless face", tags: ["blank"] },
            { char: "😶", name: "face without mouth", tags: ["mute"] },
            { char: "😏", name: "smirking face", tags: ["smirk", "flirt"] },
            { char: "😒", name: "unamused face", tags: ["bored", "displeased"] },
            { char: "🙄", name: "face with rolling eyes", tags: ["eyeroll"] },
            { char: "😬", name: "grimacing face", tags: ["awkward", "nervous"] },
            { char: "🤥", name: "lying face", tags: ["pinocchio", "lie"] },
            { char: "😴", name: "sleeping face", tags: ["tired", "sleep", "zzz"] },
            { char: "😷", name: "face with medical mask", tags: ["sick"] },
            { char: "🤒", name: "face with thermometer", tags: ["ill"] },
            { char: "🤕", name: "face with head-bandage", tags: ["hurt"] },
            { char: "🤢", name: "nauseated face", tags: ["gross"] },
            { char: "🤮", name: "face vomiting", tags: ["puke"] },
            { char: "🥵", name: "hot face", tags: ["heat", "sweat"] },
            { char: "🥶", name: "cold face", tags: ["freezing"] },
            { char: "😵", name: "dizzy face", tags: ["faint"] },
            { char: "🤯", name: "exploding head", tags: ["mindblown"] },
            { char: "🥳", name: "partying face", tags: ["celebrate", "party"] },
            { char: "😎", name: "smiling face with sunglasses", tags: ["cool", "shades"] },
            { char: "🤓", name: "nerd face", tags: ["geek"] },
            { char: "🧐", name: "face with monocle", tags: ["curious"] },
            { char: "😕", name: "confused face", tags: ["puzzled"] },
            { char: "😟", name: "worried face", tags: ["nervous"] },
            { char: "🙁", name: "slightly frowning face", tags: ["sad"] },
            { char: "😮", name: "face with open mouth", tags: ["surprise", "wow"] },
            { char: "😯", name: "hushed face", tags: ["stunned"] },
            { char: "😲", name: "astonished face", tags: ["shocked"] },
            { char: "😳", name: "flushed face", tags: ["embarrassed"] },
            { char: "🥺", name: "pleading face", tags: ["puppy", "please"] },
            { char: "😦", name: "frowning face with open mouth", tags: ["gasp"] },
            { char: "😧", name: "anguished face", tags: ["stunned"] },
            { char: "😨", name: "fearful face", tags: ["scared"] },
            { char: "😰", name: "anxious face with sweat", tags: ["nervous"] },
            { char: "😥", name: "sad but relieved face", tags: ["phew"] },
            { char: "😢", name: "crying face", tags: ["tear", "sad"] },
            { char: "😭", name: "loudly crying face", tags: ["sob", "sad"] },
            { char: "😱", name: "face screaming in fear", tags: ["horror"] },
            { char: "😖", name: "confounded face", tags: ["frustrated"] },
            { char: "😣", name: "persevering face", tags: ["struggling"] },
            { char: "😞", name: "disappointed face", tags: ["down"] },
            { char: "😓", name: "downcast face with sweat", tags: ["defeated"] },
            { char: "😩", name: "weary face", tags: ["tired"] },
            { char: "😫", name: "tired face", tags: ["exhausted"] },
            { char: "🥱", name: "yawning face", tags: ["sleepy"] },
            { char: "😤", name: "face with steam from nose", tags: ["triumph", "angry"] },
            { char: "😡", name: "enraged face", tags: ["furious", "angry"] },
            { char: "😠", name: "angry face", tags: ["mad"] },
            { char: "🤬", name: "face with symbols on mouth", tags: ["swearing"] },
            { char: "😈", name: "smiling face with horns", tags: ["devil", "mischief"] },
            { char: "👿", name: "angry face with horns", tags: ["demon"] },
            { char: "💀", name: "skull", tags: ["dead", "skeleton"] },
            { char: "💩", name: "pile of poo", tags: ["poop"] },
            { char: "🤡", name: "clown face", tags: ["clown"] },
            { char: "👻", name: "ghost", tags: ["spooky", "boo"] },
        ],
    },
    {
        name: "Hands & Gestures",
        emojis: [
            { char: "👋", name: "waving hand", tags: ["hello", "bye", "wave"] },
            { char: "🤚", name: "raised back of hand", tags: ["stop"] },
            { char: "🖐️", name: "hand with fingers splayed", tags: ["five"] },
            { char: "✋", name: "raised hand", tags: ["high five", "stop"] },
            { char: "🖖", name: "vulcan salute", tags: ["spock"] },
            { char: "👌", name: "OK hand", tags: ["perfect", "ok"] },
            { char: "🤌", name: "pinched fingers", tags: ["italian"] },
            { char: "🤏", name: "pinching hand", tags: ["tiny", "little"] },
            { char: "✌️", name: "victory hand", tags: ["peace"] },
            { char: "🤞", name: "crossed fingers", tags: ["luck", "hope"] },
            { char: "🤟", name: "love-you gesture", tags: ["ily"] },
            { char: "🤘", name: "sign of the horns", tags: ["rock"] },
            { char: "🤙", name: "call me hand", tags: ["shaka", "hang loose"] },
            { char: "👈", name: "backhand index pointing left", tags: ["point"] },
            { char: "👉", name: "backhand index pointing right", tags: ["point"] },
            { char: "👆", name: "backhand index pointing up", tags: ["up"] },
            { char: "👇", name: "backhand index pointing down", tags: ["down"] },
            { char: "☝️", name: "index pointing up", tags: ["one"] },
            { char: "👍", name: "thumbs up", tags: ["approve", "like", "yes"] },
            { char: "👎", name: "thumbs down", tags: ["dislike", "no"] },
            { char: "✊", name: "raised fist", tags: ["power"] },
            { char: "👊", name: "oncoming fist", tags: ["fist bump", "bro"] },
            { char: "🤛", name: "left-facing fist", tags: ["bump"] },
            { char: "🤜", name: "right-facing fist", tags: ["bump"] },
            { char: "👏", name: "clapping hands", tags: ["applause", "bravo"] },
            { char: "🙌", name: "raising hands", tags: ["praise", "cheer"] },
            { char: "👐", name: "open hands", tags: ["open"] },
            { char: "🤲", name: "palms up together", tags: ["prayer", "duo"] },
            { char: "🤝", name: "handshake", tags: ["deal", "agreement"] },
            { char: "🙏", name: "folded hands", tags: ["please", "thank you", "pray"] },
            { char: "✍️", name: "writing hand", tags: ["write", "pen"] },
            { char: "💪", name: "flexed biceps", tags: ["strong", "workout"] },
        ],
    },
    {
        name: "Hearts & Symbols",
        emojis: [
            { char: "❤️", name: "red heart", tags: ["love", "heart"] },
            { char: "🧡", name: "orange heart", tags: ["love"] },
            { char: "💛", name: "yellow heart", tags: ["love", "friendship"] },
            { char: "💚", name: "green heart", tags: ["love"] },
            { char: "💙", name: "blue heart", tags: ["love", "peace"] },
            { char: "💜", name: "purple heart", tags: ["love"] },
            { char: "🖤", name: "black heart", tags: ["dark"] },
            { char: "🤍", name: "white heart", tags: ["pure"] },
            { char: "🤎", name: "brown heart", tags: ["heart"] },
            { char: "💔", name: "broken heart", tags: ["sad", "heartbreak"] },
            { char: "❤️‍🔥", name: "heart on fire", tags: ["passion", "flame"] },
            { char: "💖", name: "sparkling heart", tags: ["shine", "love"] },
            { char: "💗", name: "growing heart", tags: ["pulse"] },
            { char: "💓", name: "beating heart", tags: ["heartbeat"] },
            { char: "💞", name: "revolving hearts", tags: ["love"] },
            { char: "💕", name: "two hearts", tags: ["love"] },
            { char: "🔥", name: "fire", tags: ["lit", "hot", "flame"] },
            { char: "✨", name: "sparkles", tags: ["magic", "clean", "shine"] },
            { char: "🌟", name: "glowing star", tags: ["star"] },
            { char: "⭐", name: "star", tags: ["fav"] },
            { char: "⚡", name: "high voltage", tags: ["lightning", "fast", "bolt"] },
            { char: "💥", name: "collision", tags: ["boom", "bang"] },
            { char: "💯", name: "hundred points", tags: ["perfect", "score", "100"] },
            { char: "🎉", name: "party popper", tags: ["tada", "celebration"] },
            { char: "🎊", name: "confetti ball", tags: ["party"] },
            { char: "🎈", name: "balloon", tags: ["birthday"] },
            { char: "🎁", name: "wrapped gift", tags: ["present"] },
            { char: "🏆", name: "trophy", tags: ["winner", "prize"] },
            { char: "🥇", name: "1st place medal", tags: ["gold"] },
            { char: "🎯", name: "direct hit", tags: ["target", "bullseye"] },
            { char: "🚀", name: "rocket", tags: ["launch", "moon", "fast"] },
            { char: "💡", name: "light bulb", tags: ["idea"] },
            { char: "💬", name: "speech balloon", tags: ["message", "chat"] },
            { char: "✅", name: "check mark button", tags: ["done", "yes"] },
            { char: "❌", name: "cross mark", tags: ["no", "cancel"] },
        ],
    },
    {
        name: "Animals & Food",
        emojis: [
            { char: "🐶", name: "dog face", tags: ["puppy", "pet"] },
            { char: "🐱", name: "cat face", tags: ["kitten", "pet"] },
            { char: "🐭", name: "mouse face", tags: ["mouse"] },
            { char: "🐰", name: "rabbit face", tags: ["bunny"] },
            { char: "🦊", name: "fox", tags: ["fox"] },
            { char: "🐻", name: "bear", tags: ["bear"] },
            { char: "🐼", name: "panda", tags: ["panda"] },
            { char: "🦁", name: "lion", tags: ["lion", "king"] },
            { char: "🐯", name: "tiger face", tags: ["tiger"] },
            { char: "🐵", name: "monkey face", tags: ["monkey"] },
            { char: "🐧", name: "penguin", tags: ["penguin"] },
            { char: "🐦", name: "bird", tags: ["bird"] },
            { char: "🦄", name: "unicorn", tags: ["magic"] },
            { char: "🍕", name: "pizza", tags: ["food", "cheese"] },
            { char: "🍔", name: "hamburger", tags: ["burger", "food"] },
            { char: "🍟", name: "french fries", tags: ["fries", "food"] },
            { char: "🌮", name: "taco", tags: ["mexican"] },
            { char: "🍣", name: "sushi", tags: ["japanese"] },
            { char: "🍦", name: "ice cream", tags: ["sweet"] },
            { char: "🍩", name: "doughnut", tags: ["donut"] },
            { char: "🍪", name: "cookie", tags: ["sweet"] },
            { char: "🍫", name: "chocolate bar", tags: ["candy"] },
            { char: "☕", name: "hot beverage", tags: ["coffee", "tea"] },
            { char: "🧋", name: "bubble tea", tags: ["boba"] },
            { char: "🍺", name: "beer mug", tags: ["drink", "cheers"] },
            { char: "🍻", name: "clinking beer mugs", tags: ["toast", "cheers"] },
        ],
    },
];

export default function EmojiPicker({ onSelect, onClose }) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const pickerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose?.();
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                onClose?.();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    // Search filter across all categories
    const filteredEmojis = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return null;

        const results = [];
        for (const cat of EMOJI_CATEGORIES) {
            for (const item of cat.emojis) {
                if (
                    item.name.toLowerCase().includes(query) ||
                    item.tags.some((tag) => tag.includes(query))
                ) {
                    results.push(item);
                }
            }
        }
        return results;
    }, [search]);

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 left-2 z-50 flex h-80 w-72 sm:w-80 flex-col rounded-2xl border border-(--border) bg-(--surface-lowest) shadow-xl duration-150 animate-in fade-in zoom-in-95"
            role="dialog"
            aria-label="Emoji picker"
        >
            {/* Search header */}
            <div className="flex items-center gap-2 border-b border-(--border) p-2.5">
                <Search size={16} className="text-secondary shrink-0 ml-1" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search emojis…"
                    className="w-full bg-transparent text-xs text-primary placeholder:text-secondary focus:outline-none"
                    autoFocus
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-secondary hover:text-primary mr-1"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Category tabs (hidden when searching) */}
            {!filteredEmojis && (
                <div className="flex border-b border-(--border) px-2 py-1 text-xs">
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat.name}
                            type="button"
                            onClick={() => setActiveTab(idx)}
                            className={`flex-1 py-1 text-center transition-colors rounded-md font-medium truncate px-1 ${
                                activeTab === idx
                                    ? "bg-(--surface-low) text-(--primary)"
                                    : "text-secondary hover:text-primary"
                            }`}
                        >
                            {cat.name.split(" ")[0]}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji grid scroll area */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredEmojis ? (
                    filteredEmojis.length > 0 ? (
                        <div className="grid grid-cols-7 gap-1">
                            {filteredEmojis.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onSelect(item.char)}
                                    title={item.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-(--surface-low) active:scale-90 transition-transform"
                                >
                                    {item.char}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-xs text-secondary">
                            No emojis found for "{search}"
                        </p>
                    )
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-secondary px-1">
                            {EMOJI_CATEGORIES[activeTab].name}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {EMOJI_CATEGORIES[activeTab].emojis.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onSelect(item.char)}
                                    title={item.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-(--surface-low) active:scale-90 transition-transform"
                                >
                                    {item.char}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
